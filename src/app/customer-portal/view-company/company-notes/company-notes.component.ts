import { Component, OnInit, ElementRef, ViewChild } from "@angular/core";
import * as ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { NotificationsService } from "angular2-notifications";
import { NotesApi } from "../notes.api.service";
import { ActivatedRoute, ParamMap, Router } from "@angular/router";
import { NgxSpinnerService } from "ngx-spinner";
import { DataStore } from "app/providers/datastore";
import { IActionMapping, TREE_ACTIONS } from "angular-tree-component";
import Swal from "sweetalert2";
enum EditType {
  CREATE,
  UPDATE,
}

@Component({
  selector: "app-company-notes",
  templateUrl: "./company-notes.component.html",
  styleUrls: ["./company-notes.component.scss"],
})
export class CompanyNotesComponent implements OnInit {
  @ViewChild("editModal", { static: false }) editModal: ElementRef;
  @ViewChild("folderTree", { static: true }) folderTree;

  public Editor = ClassicEditor;
  companyId: any;
  editType: EditType;
  editModalTitle = "";
  subject = "";
  description = "";
  noteType = "";
  notes: any;
  isSpinnerVisible = false;
  notedata: any[] = [];
  folderNodes: any[] = [];
  currentNote: any = {};
  activeFolderNode = null;
  note_id: any;
  isAdd=false;
  selectedNode:any;
  isComment=false;
  noteTypes = [
    {
      text: "Company",
      value: "company",
    },
    {
      text: "Personal",
      value: "personal",
    },
    {
      text: "Public",
      value: "Public",
    },
    {
      text: "ACL",
      value: "Contract",
    },
  ];
  actionMapping: IActionMapping = {
    mouse: {
      click: (tree, node, event) => {
        TREE_ACTIONS.TOGGLE_SELECTED(tree, node, event);
        if (node !== this.activeFolderNode) {
          this.activeFolderNode = node;
          this.currentNote = node.data;
          console.log("currentdata", this.currentNote);
        }
      },
    },
  };

  treeOptions = {
    actionMapping: this.actionMapping,
  };

  constructor(
    private notificationService: NotificationsService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private notesApi: NotesApi,
    private spinner: NgxSpinnerService,
    public dataStore: DataStore
  ) {}

  ngOnInit() {
    this.load();
    console.log("dataStore", this.dataStore);
  }

  onEditNotes() {
    console.log(this.activeFolderNode);
    if (!this.currentNote) {
      // tslint:disable-next-line: max-line-length
      return this.notificationService.error(
        "Error",
        "Please select a note to add comment",
        { timeOut: 3000, showProgressBar: false }
      );
    }
    this.editModalTitle = `Add Comment`;
    this.subject = "Re:" + this.activeFolderNode.data.subject;
    this.editModal.nativeElement.style.display = "block";
    this.editType = EditType.UPDATE;
  }
  load() {
    this.spinner.show();
    this.companyId = this.activatedRoute.snapshot.queryParams["company_id"];
    this.notesApi
      .getNotesByCompanyId(this.companyId)
      .then((res: any[]) => {
        this.notes = res;
        this.folderNodes = res;
        console.log("Notes :", res);
        this.spinner.hide();
      })
      .catch((err) => {
        this.notificationService.error("Error", err, {
          timeOut: 3000,
          showProgressBar: false,
        });
      });
  }

  onAdd() {
   
    this.isComment=false;
    this.editModalTitle = `Add Notes`;
    this.subject = "";
    this.editModal.nativeElement.style.display = "block";
    this.editType = EditType.CREATE;
    this.activeFolderNode = null;
    this.note_id = 0;
  }

  onAddComment() {
    debugger;
    this.isComment=true;
    console.log(this.activeFolderNode);
    if (!this.currentNote) {
      // tslint:disable-next-line: max-line-length
      return this.notificationService.error(
        "Error",
        "Please select a note to add comment",
        { timeOut: 3000, showProgressBar: false }
      );
    }
    this.editModalTitle = `Add Comment`;
    this.subject = "Re:" + this.activeFolderNode.data.subject;
    this.editModal.nativeElement.style.display = "block";
    this.editType = EditType.CREATE;
    this.note_id = 0;
  }

  onCloseEditModal() {
    this.editModal.nativeElement.style.display = "none";
  }

  saveNotes() {
    debugger;
    if (!this.subject || !this.subject.trim()) {
      return this.notificationService.error(
        "Error",
        "Please input note subject",
        { timeOut: 3000, showProgressBar: false }
      );
    }

    if (!this.description || !this.description.trim()) {
      return this.notificationService.error(
        "Error",
        "Please input note description",
        { timeOut: 3000, showProgressBar: false }
      );
    }
    const created_user_id = this.dataStore.currentUser.user_id;
    let note_parent_id=null;
    if(!this.isComment){
       note_parent_id = this.activeFolderNode
      ? this.activeFolderNode.data.parent_id
      : this.companyId;
    }
    else{
       note_parent_id = this.activeFolderNode
      ? this.activeFolderNode.data.id
      : this.companyId;
    } 
    const params: any = {
      created_user_id: created_user_id,
      note_company_id: this.companyId,
      note_desc: this.description,
      note_type: this.noteType,
      note_parent_id: note_parent_id,
      note_priority: "High",
      note_relevance_number: 0,
      note_vote_count: 0,
      note_subject: this.subject,
      note_id: this.note_id,
    };

    this.spinner.show();
    if (this.note_id == 0) {
      this.notesApi.createNote(params).then(
        (data) => {
          this.spinner.hide();
          this.load();
          this.folderTree.treeModel.update();
          this.reset();
          this.editModal.nativeElement.style.display = "none";
          this.notificationService.success("Success", "Note has been created", {
            timeOut: 3000,
            showProgressBar: false,
          });
        },
        (error) => {
          this.spinner.hide();
          this.notificationService.error("Error", error, {
            timeOut: 3000,
            showProgressBar: false,
          });
        }
      );
    } else {
      this.notesApi.updateNote(params).then(
        (data) => {
          this.spinner.hide();
          this.load(); 
          debugger     
          this.folderTree.treeModel.update();         
          this.reset();
          this.editModal.nativeElement.style.display = "none";
          this.notificationService.success("Success", "Note has been Updated", {
            timeOut: 3000,
            showProgressBar: false,
          });
          let nodeId="div-"+this.currentNote.id;          
          let element: HTMLElement=document.getElementById(nodeId) as HTMLElement;
          element.click();           
          element.click(); 
        },
        (error) => {
          this.spinner.hide();
          this.notificationService.error("Error", error, {
            timeOut: 3000,
            showProgressBar: false,
          });
        }
      );
    }
  }

  reset() {
    this.subject = "";
    this.description = "";
  }

  onEdit(node) {
    console.log("Node",node);
    this.isComment=false;
    debugger;
    console.log(this.activeFolderNode);
    if (!node) {
      // tslint:disable-next-line: max-line-length
      return this.notificationService.error(
        "Error",
        "Please select a note to Edit Note",
        { timeOut: 3000, showProgressBar: false }
      );
    }
    this.note_id = node.id;
    this.editModalTitle = `Edit Note`;
    this.subject = node.subject;
    this.editModal.nativeElement.style.display = "block";
    this.description = node.description;
    this.editType = EditType.UPDATE;
    this.noteType = node.noteType;
  }

 

  onDelete(id) {
    debugger;
    Swal.fire({
      title: "Are you sure?",
      text: "Once deleted, you will not be able to recover this Notes!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
    }).then((result) => {
      if (result.value) {
        this.notesApi.deleteNote(id).then(
          (data) => {
            this.spinner.hide();
            this.load();
            this.folderTree.treeModel.update();
            this.currentNote='';
            //this.reset();
            //this.editModal.nativeElement.style.display = 'none';
            this.notificationService.success(
              "Success",
              "Note has been Deleted",
              {
                timeOut: 3000,
                showProgressBar: false,
              }
            );
          },
          (error) => {
            this.spinner.hide();
            this.notificationService.error("Error", error, {
              timeOut: 3000,
              showProgressBar: false,
            });
          }
        );
      }
    });
  }

  isVisible(note: any){ 
    const user_id = this.dataStore.currentUser.user_id;
    const company_id = this.dataStore.currentCompany.company_id;
    if(note.noteType=='public'){
      return true;
    } else if(note.noteType=='personal' && note.userId==user_id){
        return true;
    }else if(note.noteType=='company' && note.companyId==company_id){
  return true
    }    
  }
}
