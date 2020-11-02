import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from "@angular/core";
import * as ClassicEditor from "@app/../assets/ckeditor/build/ckeditor";
import { NotificationsService } from "angular2-notifications";
import { NotesApi } from "../notes.api.service";
import { ActivatedRoute, ParamMap, Router } from "@angular/router";
import { NgxSpinnerService } from "ngx-spinner";
import { DataStore } from "app/providers/datastore";
import { IActionMapping, TREE_ACTIONS } from "angular-tree-component";
import Swal from "sweetalert2";

declare var tinymce: any;

enum EditType {
  CREATE,
  UPDATE,
}

@Component({
  selector: "app-company-notes",
  templateUrl: "./company-notes.component.html",
  styleUrls: ["./company-notes.component.scss"],
})
export class CompanyNotesComponent implements OnInit, AfterViewInit {
  @ViewChild("editModal", { static: false }) editModal: ElementRef;
  @ViewChild("folderTree", { static: true }) folderTree;
     
  public Editor = ClassicEditor;
   
  myTitle = 'floarla';
  model: any;
  FroalaEditor:any;
  content: string = '<span>My Document\'s Title</span>';

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
  isAdd = false;
  created_user_name:any;
  selectedNode: any;
  isComment = false;
  ischildVisible = false;
  note_parent_type:any;
  firstName:any;
  lastName:any; 
  createdDate:any;
  divStyle = "";
  tinymceInit:any;
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
      value: "public",
    },
  ];
  actionMapping: IActionMapping = {
    mouse: {
      click: (tree, node, event) => {
        node.setIsActive(true);
        TREE_ACTIONS.TOGGLE_SELECTED(tree, node, event);
        if (node !== this.activeFolderNode) {
          
          this.activeFolderNode = node;
          this.currentNote = node.data; 
          this.activeFolderNode.expandAll()  
          //this.activeFolderNode.collapseToLevel(3);

          this.createdDate=this.currentNote.createdDate
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
  ) {
   
  } 

  public imgModel: Object = {
    src: '/image.jpg'
  };
  public imgOptions: Object = {
    angularIgnoreAttrs: ['style', 'ng-reflect-froala-editor', 'ng-reflect-froala-model'],
    immediateAngularModelUpdate: true,
    events: {
      "contentChanged": () => {
      }
    }
  }
  ngOnInit() {
    this.load();
    // this.firstName = this.dataStore.currentUser.user_firstname;
    // this.lastName = this.dataStore.currentUser.user_lastname; 
    // console.log("firstName", this.firstName);   
    // console.log("lastName", this.lastName);  
    // this.FroalaEditor.DefineIcon('alert', { SVG_KEY: 'help' });
    // this.FroalaEditor.RegisterCommand('alert', {
    //   title: 'Hello',
    //   focus: false,
    //   undo: false,
    //   refreshAfterCallback: false,  
    //   callback: function () {
    //     alert('Hello!');
    //   }
    // }); 
  
  }
 
  onEditNotes() {
    if (!this.currentNote) {
      // tslint:disable-next-line: max-line-length
      return this.notificationService.error(
        "Error",
        "Please select a note to add comment",
        { timeOut: 3000, showProgressBar: false }
      );
    }
    this.editModalTitle = `Add Comment`;
    this.subject = "Re:" + this.activeFolderNode.data.note_subject;
    this.editModal.nativeElement.style.display = "block";
    this.editType = EditType.UPDATE;
  }

  load() {
    
    this.spinner.show();
    this.companyId = this.activatedRoute.snapshot.queryParams["company_id"];
    const params: any = {
      company_id: this.companyId,
      return_child_notes: true,
    }; 
    this.notesApi
      .findNotes(params)
      .then((res: any[]) => {
        
        this.notes = res;        
        this.folderNodes = res;        
        this.spinner.hide();
        setTimeout(() => this.folderTree.treeModel.expandAll(), 500)
      })
      .catch((err) => {
        this.notificationService.error("Error", err, {
          timeOut: 3000,
          showProgressBar: false,
        });
      });
  }

 ngAfterViewInit() {
    setTimeout(() => this.setNodeActiveOnLaodTree(), 500)
  } 

  setNodeActiveOnLaodTree(){
   this.folderTree.treeModel.expandAll();
   const node =  this.folderTree.treeModel.getFirstRoot();
   TREE_ACTIONS.TOGGLE_SELECTED(this.folderTree, node, event);
   TREE_ACTIONS.ACTIVATE(this.folderTree, node, event);
   TREE_ACTIONS.SELECT(this.folderTree, node, event);
   this.activeFolderNode = node;
   this.currentNote = node.data; 
  }

  onAdd() {
    this.description = "";
    this.editModalTitle = `Add Notes`;
    this.subject = "";
    this.editModal.nativeElement.style.display = "block";
    this.editType = EditType.CREATE;
    this.activeFolderNode = null;
    this.note_id = 0;
  }

  onAddComment() {
    this.description = "";
    this.isComment = true;
    if (!this.currentNote) {
      // tslint:disable-next-line: max-line-length
      return this.notificationService.error(
        "Error",
        "Please select a note to add comment",
        { timeOut: 3000, showProgressBar: false }
      );
    }
    this.editModalTitle = `Add Comment`;
    if (this.activeFolderNode.data.note_subject.indexOf("Re:") !== -1) {
      this.subject = this.activeFolderNode.data.note_subject;
    } else {
      this.subject = "Re:" + this.activeFolderNode.data.note_subject;
    }
    this.editModal.nativeElement.style.display = "block";
    this.editType = EditType.CREATE;
    this.note_id = 0;
  }

  onCloseEditModal() {
    this.editModal.nativeElement.style.display = "none";
  }

  saveNotes() {
    ;
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
    this.note_parent_type="Company"
    const created_user_id = this.dataStore.currentUser.user_id;
    let note_parent_id = null;
    if (!this.isComment) {
      note_parent_id = this.activeFolderNode
        ? this.activeFolderNode.data.note_parent_id
        : this.companyId;
    } else {
      note_parent_id = this.activeFolderNode
        ? this.activeFolderNode.data.note_id
        : this.companyId;
    }
    const params: any = {
      created_user_id: created_user_id,
      note_company_id: this.companyId,
      note_desc: this.description,
      note_type: this.noteType,
      note_parent_type:this.note_parent_type,
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
          ;
          this.folderTree.treeModel.update();
          this.reset();
          this.editModal.nativeElement.style.display = "none";
          this.notificationService.success("Success", "Note has been Updated", {
            timeOut: 3000,
            showProgressBar: false,
          });
          let nodeId = "div-" + this.currentNote.id;
          let element: HTMLElement = document.getElementById(
            nodeId
          ) as HTMLElement;
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
    this.isComment = false;

    if (!node) {
      // tslint:disable-next-line: max-line-length
      return this.notificationService.error(
        "Error",
        "Please select a note to Edit Note",
        { timeOut: 3000, showProgressBar: false }
      );
    }
    this.note_id = node.note_id;
    this.editModalTitle = `Edit Note`;
    this.subject = node.note_subject;
    this.editModal.nativeElement.style.display = "block";
    this.description = node.note_desc;
    this.editType = EditType.UPDATE;
    this.noteType = node.note_type;
  }

  onDelete(id) {
    ;
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
            this.currentNote = "";
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

  isVisible(note: any) {
    this.ischildVisible = false;
    if(this.dataStore.currentCompany != null){
      const user_id = this.dataStore.currentUser.user_id;
      const company_id = this.dataStore.currentCompany.company_id;
      if (note.note_type == "public") {
        this.ischildVisible = true;
        return true;
      } else if (note.note_type === 'personal' && note.note_user_id === user_id) {//if personal show only when userid matches
        this.ischildVisible = true;
        return true;
      } else if (note.note_type == "company" && note.note_company_id === (company_id?company_id :note.note_company_id) ) { 
        this.ischildVisible = true;
        return true;
      } else if (note.note_type == "" && note.note_company_id === (company_id?company_id :note.note_company_id)) {
        this.ischildVisible = true;
        return true;
      }
    }
    return false;
  }
}
