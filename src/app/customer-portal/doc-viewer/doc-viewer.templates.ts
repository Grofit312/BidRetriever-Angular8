const templates = {
  default: `<webpdf>
  <toolbar name="toolbar">
    <tabs name='toolbar-tabs'>
      <tab title='Home' name='home-tab'>
        <group-list name='home-toolbar-group-list'>
          <group name="home-tab-group-hand" retain-count="3">
            <xbutton id='prevDoc' icon-class='fv_icon-toolbar-left-arrow'></xbutton>
            <div id='docFilter'></div>
            <xbutton id='nextDoc' icon-class='fv_icon-toolbar-right-arrow'></xbutton>
          </group>
          <group name="home-tab-group-zoom">
            <zoom-out-button></zoom-out-button>
            <xbutton id='zoomExtent' icon-class='fv_icon-toolbar-zoom-extent'></xbutton>
            <marquee-tool-button></marquee-tool-button>
            <loupe-tool-button></loupe-tool-button>
            <zoom-in-button></zoom-in-button>
          </group>
          <group name="home-tab-group-zoom">
            <hand-button></hand-button>
            <selection-button></selection-button>
            <snapshot-button></snapshot-button>
          </group>
          <group name="home-tab-group-io" retain-count="1" shrink-title="toolbar.more.document.title">
            <download-file-button></download-file-button>
            <print:print-button id='print-button'></print:print-button>
          </group>
          <group name="home-tab-favorite">
            <xbutton id='addFavorite' icon-class='fv__icon-toolbar-add-favorite'></xbutton>
            <xbutton id='removeFavorite' icon-class='fv__icon-toolbar-remove-favorite'></xbutton>
          </group>
          <group name="home-tab-dropdown">
            <dropdown title="Other Actions" icon-class='fv__icon-toolbar-gear'>
              <dropdown-button id='btn_view_project'>View Project</dropdown-button>
              <dropdown-button id='btn_edit_project'>Edit Project</dropdown-button>
              <contextmenu-separator></contextmenu-separator>
              <dropdown-button id='btn_view_details'>View Document Details</dropdown-button>
              <dropdown-button id='btn_edit_file'>Edit Document</dropdown-button>
              <dropdown-button id='btn_print_file'>Print Document</dropdown-button>
              <contextmenu-separator></contextmenu-separator>
              <dropdown-button id='btn_download_file'>Download File</dropdown-button>
              <dropdown-button id='btn_download_folder'>Download Folder</dropdown-button>
              <dropdown-button id='btn_download_project'>Download Project</dropdown-button>
              <contextmenu-separator></contextmenu-separator>
              <dropdown-button id='btn_help'>Help</dropdown-button>
            </dropdown>
          </group>
        </group-list>
      </tab>

      <tab title='Markup' name='markup-tab'>
        <group-list name='markup-toolbar-group-list'>
          <group name="markup-tab-group-text">
            <create-note-button></create-note-button>
            <dropdown icon-class="fv__icon-toolbar-text-highlight">
              <create-text-highlight-button></create-text-highlight-button>
              <create-strikeout-button></create-strikeout-button>
              <create-underline-button></create-underline-button>
              <create-squiggly-button></create-squiggly-button>
              <create-replace-button></create-replace-button>
              <create-caret-button></create-caret-button>
            </dropdown>
            <create-typewriter-button></create-typewriter-button>
            <create-callout-button></create-callout-button>
            <create-textbox-button></create-textbox-button>
          </group>
          <group name='markup-tab-group-shapes'>
            <xbutton @controller="states:CreateSquareController" name="create-square" icon-class="fv__icon-toolbar-square"></xbutton>
            <xbutton @controller="states:CreateCircleController" name="create-circle" icon-class="fv__icon-toolbar-circle"></xbutton>
            <xbutton @controller="states:CreateLineController" name="create-line" icon-class="fv__icon-toolbar-line"></xbutton>
            <xbutton @controller="states:CreateArrowController" name="create-arrow" icon-class="fv__icon-toolbar-arrow"></xbutton>
            <xbutton @controller="states:CreatePolygonController" name="create-polygon" icon-class="fv__icon-toolbar-polygon"></xbutton>
            <xbutton @controller="states:CreatePolylineController" name="create-polyline" icon-class="fv__icon-toolbar-polyline"></xbutton>
            <xbutton @controller="states:CreatePolygonCloudController" name="create-cloud" icon-class="fv__icon-toolbar-cloud"></xbutton>
          </group>
          <group name='markup-tab-group-annot'>
            <create-area-highlight-button></create-area-highlight-button>
            <create-pencil-button></create-pencil-button>
            <eraser-button></eraser-button>
            <stamp-dropdown></stamp-dropdown>
            <create-distance-button></create-distance-button>
            <create-image-button></create-image-button>
          </group>
          <group name="edit-tab-group-font"></group>
          <group name="edit-tab-group-mode"></group>
        </group-list>
      </tab>
    </tabs>
  </toolbar>
  <div class="fv__ui-body">
    <sidebar name="sidebar" @controller="sidebar:SidebarController">
      <sidebar-panel id='documentDetail' icon-class='fv__icon-sidebar-detail' title='Document Details' name='sidebar-detail'></sidebar-panel>
      <sidebar-panel id='favoriteList' icon-class='fv__icon-sidebar-favorites' title='Favorites' name='sidebar-favorites'></sidebar-panel>
      <sidebar-panel id='currentPlanList' icon-class='fv__icon-sidebar-current-plans' title='Current Project Plans' name='sidebar-current-plans'></sidebar-panel>
      <sidebar-panel id='currentSpecsList' icon-class='fv__icon-sidebar-current-specs' title='Current Project Specs' name='sidebar-current-specs'></sidebar-panel>
      <sidebar-panel id='linkedList' icon-class='fv__icon-sidebar-linked' title='Linked Documents' name='sidebar-linked'></sidebar-panel>
      <sidebar-panel id='comparisonList' icon-class='fv__icon-sidebar-comparison' title='Comparison Drawings' name='sidebar-comparison'></sidebar-panel>
      <sidebar-panel id='sourceList' icon-class='fv__icon-sidebar-source-docs' title='Source Documents' name='sidebar-source-docs'></sidebar-panel>
      <thumbnail-sidebar-panel></thumbnail-sidebar-panel>
      <commentlist-sidebar-panel></commentlist-sidebar-panel>
      <search-sidebar-panel></search-sidebar-panel>
    </sidebar>
    <distance:ruler-container name="pdf-viewer-container-with-ruler">
      <slot>
        <viewer @zoom-on-wheel></viewer>
      </slot>
    </distance:ruler-container>
  </div>
  <template name="template-container">
    <create-stamp-dialog></create-stamp-dialog>
    <print:print-dialog></print:print-dialog>
    <loupe-tool-dialog></loupe-tool-dialog>
    <create-ink-sign-dialog></create-ink-sign-dialog>
    <measurement-popup></measurement-popup>
  </template>
  </webpdf>
  `
};

export default templates;
