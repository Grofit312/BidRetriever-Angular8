import { Pipe, PipeTransform } from "@angular/core";

@Pipe({ name: 'timeTillBid' })
export class TimeTillBidPipe implements PipeTransform {
  transform(value: number): string {
    if (value === Number.MAX_SAFE_INTEGER) {
      return 'N/A';
    }

    const totalHours = Math.floor(value / 3600);
    const day = Math.floor(totalHours / 24);
    const hours = totalHours - day * 24;
    
    return `${day}d ${hours}h`;
  }
}
