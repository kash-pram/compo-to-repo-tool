import { Component, signal } from '@angular/core';
import { SampleComponent } from './components/sample-component/sample-component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SampleComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('angular-project-sample');
}
