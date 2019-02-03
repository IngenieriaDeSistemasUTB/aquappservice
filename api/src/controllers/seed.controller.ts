import {inject} from '@loopback/context';
import {get} from '@loopback/openapi-v3';
import {
  NodeTypeRepository,
  NodeRepository,
  SensorRepository,
  DatumRepository,
  NodeDataRepository,
} from '../repositories';
import {repository} from '@loopback/repository';
import {authenticate, AuthenticationBindings} from '@loopback/authentication';
// import {Datum, Node, NodeType, Sensor} from '../models';
import * as fs from 'fs';
import * as path from 'path';
import {Datum, NodeData} from '../models';

export class SeedController {
  constructor(
    @repository(DatumRepository) public datumRepository: DatumRepository,
    @repository(NodeRepository) public nodeRepository: NodeRepository,
    @repository(NodeTypeRepository)
    public nodeTypeRepository: NodeTypeRepository,
    @repository(SensorRepository) public sensorRepository: SensorRepository,
    @repository(NodeDataRepository)
    public nodeDataRepository: NodeDataRepository,
    @inject(AuthenticationBindings.CURRENT_USER, {optional: true})
    private user: {name: string; id: string; token: string; type: number},
  ) {}

  @authenticate('BearerStrategy', {type: -1})
  @get('/seed-node-data')
  async seedNodeData() {
    const nodes: string[] = [
      '5a1652279a89202b695560e2',
      '5b02af2b08de6a000d4bc0e4',
      '5b02af2b08de6a000d4bc0e5',
      '5b02af2b08de6a000d4bc0e6',
      '5b02af2b08de6a000d4bc0e7',
      '5b02af2b08de6a000d4bc0e8',
      '5b02af2b08de6a000d4bc0e9',
      '5b02af2b08de6a000d4bc0ea',
      '59b75c5f9a8920223f2eabe4',
      '59b75c5f9a8920223f2eabe5',
      '59b75c5f9a8920223f2eabe6',
      '59b75c5f9a8920223f2eabe7',
      '59b75c5f9a8920223f2eabe8',
      '59b75c5f9a8920223f2eabe9',
      '59b75c5f9a8920223f2eabea',
    ];

    for (const node of nodes) {
      const nodeDataList: NodeData[] = await this.nodeDataRepository
        .find()
        .then(nds => nds.filter(n => n.nodeId === node));

      if (nodeDataList.some(n => !!n.data.length)) {
        console.log(`Hey, ${node} has already some data in it, skipping...`);
        continue;
      }
      const data: string = fs.readFileSync(
        path.resolve(
          __dirname,
          '..',
          '..',
          '..',
          'seed_db',
          'sensor_data',
          node + '.csv',
        ),
        'UTF-8',
      );
      try {
        const lines = data.split('\n');
        for (const line of lines) {
          const values = line.trim().split(',');
          let valueIndex = 0;
          let date = new Date(values[0]);
          for (const value of values) {
            if (value === '---' || valueIndex === 0) {
              valueIndex++;
              continue;
            }
            nodeDataList[valueIndex - 1].data.push(
              new Datum({
                date: date,
                value: value,
              }),
            );
            valueIndex++;
          }
        }
        console.log(`Saving the data of node ${node}`);
        for (const nodeData of nodeDataList) {
          await this.nodeDataRepository
            .save(nodeData)
            .then(
              n => console.log(`${n.variable} variable data of ${node} saved`),
              () =>
                console.log(
                  `${nodeData.variable} variable data of ${node} NOT saved`,
                ),
            );
        }
      } catch (error) {
        console.log('Error loading data', error);
      }
    }
    console.log('Seeding finished successfully');
    return Promise.resolve({});
  }
}
