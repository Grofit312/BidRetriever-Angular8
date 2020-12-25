import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";

@Component({
  selector: "app-project-rating",
  templateUrl: "./project-rating.component.html",
  styleUrls: ["./project-rating.component.scss"],
})
export class ProjectRatingComponent implements OnInit {
  @Input() projectRating;
  @Output() rate = new EventEmitter<number>();
  selectedRating = 0;

  constructor() {}

  ngOnInit() {}

  onMouseOver(index: number) {
    this.selectedRating = index;
  }

  onMouseOut() {
    this.selectedRating = 0;
  }

  onClick(index: number) {
    this.rate.emit(index);
  }
}
