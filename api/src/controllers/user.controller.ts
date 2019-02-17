import {inject} from '@loopback/context';
import {get, post, del, put, requestBody, param} from '@loopback/openapi-v3';
import {UserRepository} from '../repositories';
import {repository} from '@loopback/repository';
import {User} from '../models';
import {authenticate, AuthenticationBindings} from '@loopback/authentication';

/**
 * This controller was created to login the admin user (KAMI), and to
 * create other users (with the admin user), in case new types of
 * users with specific permissions (to be implemented) are needed.
 */
export class UserController {
  constructor(
    @repository(UserRepository) public usersRepo: UserRepository,
    @inject(AuthenticationBindings.CURRENT_USER, {optional: true})
    private user: {name: string; id: string; token: string; type: number},
  ) {}

  /**
   * User login with HTTP basic authentication
   */
  @authenticate('BasicStrategy')
  @post('/users/login')
  async login() {
    return {token: this.user.token};
  }

  /**
   * Creates a new user
   * @param user New user
   */
  @authenticate('BearerStrategy', {type: -1})
  @post('/users/new-admin')
  async newAdmin(@requestBody() user: User) {
    return await this.usersRepo
      .create(new User(user))
      .then(() => Promise.resolve({}), () => Promise.reject({}));
  }

  /**
   * Get a page of users
   * @param pageIndex Page number, 0 to N
   * @param pageSize Elements per page
   */
  @authenticate('BearerStrategy', {type: -1})
  @get('/users/get')
  async getUsers(
    @param.query.number('pageIndex') pageIndex: number,
    @param.query.number('pageSize') pageSize: number,
  ) {
    let users: User[] = await this.usersRepo.find().then(u => u, () => []);

    return {
      items: users.slice(
        pageIndex * pageSize,
        (pageIndex + 1) * pageSize > users.length - 1
          ? undefined
          : (pageIndex + 1) * pageSize,
      ),
      total: users.length,
    };
  }

  /**
   * Delete a user by its id
   * @param id Id of the user to be deleted
   */
  @authenticate('BearerStrategy', {type: -1})
  @del('/users/del')
  async delUser(@param.query.string('id') id: string) {
    return await this.usersRepo
      .deleteById(id)
      .then(() => Promise.resolve({}), () => Promise.reject({}));
  }

  /**
   * Edits a user, replacing its properties
   * by the corresponding property in body,
   * except for the id, which remains the same.
   * @param body New user data
   */
  @authenticate('BearerStrategy', {type: -1})
  @put('/users/edit')
  async editUser(@requestBody() body: User) {
    return await this.usersRepo.findById(body.id).then(
      user => {
        user.name = body.name ? body.name : user.name;
        user.email = body.email ? body.email : user.email;
        user.password = body.password ? body.password : user.password;
        user.enabled = body.enabled;
        this.usersRepo.save(user);
        Promise.resolve({});
      },
      () => Promise.reject({}),
    );
  }
}
