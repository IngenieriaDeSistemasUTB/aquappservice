import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DATE_LOCALE } from '@angular/material';
import { TranslateService } from 'src/app/modules/utils/translation/services/translate/translate.service';
import { TranslatePipe } from 'src/app/modules/utils/translation/pipes/translate/translate.pipe';

@NgModule({
  declarations: [TranslatePipe],
  imports: [CommonModule],
  exports: [TranslatePipe],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-GB' },
    TranslateService,
    TranslatePipe
  ]
})
export class TranslationModule {}
