import {Component} from '@angular/core';
import {environment} from '../../../environments/environment';

@Component({
  selector: 'app-about',
  standalone: true,
  template: `
    <table>
      <thead>
      <tr>
        <th>Nazwa zmiennej</th>
        <th>Wartość</th>
      </tr>
      </thead>
      <tbody>
        @for (key of envKeys; track key) {
          <tr>
            <td>{{ key }}</td>
            <td>{{ getEnvValue(key) }}</td>
          </tr>
        }
      </tbody>
    </table>
  `,
  imports: [],
  styles: `table {
    width: 100%;
    border-collapse: collapse;
  }

  th, td {
    border: 1px solid #ccc;
    padding: 8px;
    text-align: left;
  }

  th {
    background: #f5f5f5;
  }
  `
})
export class AboutComponent {
  environment = environment;
  envKeys: string[] = Object.keys(environment);

  getEnvValue(key: string): unknown {
    return (this.environment as Record<string, unknown>)[key];
  }
}
