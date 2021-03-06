import { Component, OnInit } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { ApiService } from 'src/app/services/api/api.service';
import { MessageService } from 'src/app/modules/utils/message/services/message/message.service';

@Component({
  selector: 'app-seed',
  templateUrl: './seed.component.html',
  styleUrls: ['./seed.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: '0', height: 0 }),
        animate('0.5s ease-out', style({ opacity: '1', height: '*' }))
      ])
    ])
  ]
})
export class SeedComponent implements OnInit {
  loading = false;
  constructor(
    private apiservice: ApiService,
    private messageService: MessageService
  ) {}

  ngOnInit() {}

  seed() {
    this.loading = true;
    this.apiservice
      .loadSeeds()
      .toPromise()
      .then(
        () => {
          this.messageService.show('Semillas cargadas exitosamente');
          this.loading = false;
        },
        () => {
          this.messageService.show('Error al cargar las semillas');
          this.loading = false;
        }
      );
  }
}
