export class MouseGuard{
  static lastClickTime:number = 0;

  static isDoubleClick():boolean{

      var dc:boolean = false;

      if (MouseGuard.lastClickTime === 0){
          MouseGuard.lastClickTime = new Date().getTime();
      }
      else{
          dc = ( ((new Date().getTime()) - MouseGuard.lastClickTime) < 400);
          MouseGuard.lastClickTime = 0;
      }

      return dc;
  }
}
