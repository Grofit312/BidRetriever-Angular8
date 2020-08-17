import { Injectable } from "@angular/core";

@Injectable()
export class ValidationService {

  /**
   * Validate project name string
   * @param str
   */
  public validateProjectName(str: string) {
    let projectName = str.trim();
    projectName = projectName.replace(/^FW:/, '');
    projectName = projectName.replace(/^Fw:/, '');
    projectName = projectName.replace(/^fW:/, '');
    projectName = projectName.replace(/^FW:[#]/, '');
    projectName = projectName.replace(/^Fw:[#]/, '');
    projectName = projectName.replace(/^fw:[#]/, '');
    projectName = projectName.replace(/^FW[#]:/, '');
    projectName = projectName.replace(/^Fw[#]:/, '');
    projectName = projectName.replace(/^fw[#]:/, '');
    projectName = projectName.replace(/[\!\"\$\%\&\'\*\,\.\/\:\;\<\>\?\[\\\]\^\`\{\|\}\~]/g, '');
    // projectName = projectName.replace(/ /g, '_');
    projectName = projectName.replace(/__/g, '_');
    projectName = projectName.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    projectName = projectName.replace(/^_+/, '');
    projectName = projectName.replace(/^-+/, '');
    projectName = projectName.replace(/_+$/, '');
    projectName = projectName.replace(/-+$/, '');

    return projectName.charAt(0).toUpperCase() + projectName.slice(1);
  }

  /**
   * Validate destination path string
   * @param str
   */
  public validateDestinationPath(str: string, ignoreSubstitution = false) {
    let destinationPath = str.trim();

    if (ignoreSubstitution == false) {
      destinationPath = destinationPath.replace(/[\!\"\$\%\&\'\*\,\.\:\;\<\>\?\[\\\]\^\`\{\|\}\~]/g, '');
    }
    else {
      destinationPath = destinationPath.replace(/[\!\"\$\%\&\'\*\,\.\:\;\?\[\\\]\^\`\{\|\}\~]/g, '');
    }

    destinationPath = destinationPath.replace(/\/+$/, '');
    destinationPath = destinationPath.replace(/^\/+/, '');
    destinationPath = destinationPath.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

    return destinationPath.trim();
  }

  /**
   * Validate project name string
   * @param str
   */
  public validateCompanyName(str: string) {
    let companyName = str.trim();
    companyName = companyName.replace(/^FW:/, '');
    companyName = companyName.replace(/^Fw:/, '');
    companyName = companyName.replace(/^fW:/, '');
    companyName = companyName.replace(/^FW:[#]/, '');
    companyName = companyName.replace(/^Fw:[#]/, '');
    companyName = companyName.replace(/^fw:[#]/, '');
    companyName = companyName.replace(/^FW[#]:/, '');
    companyName = companyName.replace(/^Fw[#]:/, '');
    companyName = companyName.replace(/^fw[#]:/, '');
    companyName = companyName.replace(/[\!\"\$\%\&\'\*\,\.\/\:\;\<\>\?\[\\\]\^\`\{\|\}\~]/g, '');
    // projectName = projectName.replace(/ /g, '_');
    companyName = companyName.replace(/__/g, '_');
    companyName = companyName.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    companyName = companyName.replace(/^_+/, '');
    companyName = companyName.replace(/^-+/, '');
    companyName = companyName.replace(/_+$/, '');
    companyName = companyName.replace(/-+$/, '');

    return companyName.charAt(0).toUpperCase() + companyName.slice(1);
  }
}
