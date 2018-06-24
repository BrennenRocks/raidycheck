import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'separateArray'
})
export class SeparateArrayPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    if (value && typeof args[0] === 'string' || args[0] instanceof String) {
      return value.join(args[0]);
    }

    return '';
  }

}
