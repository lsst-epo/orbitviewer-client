/**
 * UI Manager: Handles UI stuff
 */

 import { uiSet } from './uiSet';

 const containers = {
     top: null,
     menus: null,
     visible: true,
 };
 
 function fetchContainers() {
     if (containers.top != null && containers.top != undefined) return;
     containers.top = document.querySelector('.ui__top-bar');
     containers.menus = document.querySelector('.ui__right-bar');
 }
 
 export const uiSets: Array<uiSet> = [];
 
 export function resetUiSets(){
     for(const set of uiSets) set.updated = false;
 }
 
 const STATIC_UI_ITEMS = 1;
 
 export class uiManager {
     static switchVisibility() {
         if (containers.visible) uiManager.hide();
         else uiManager.show();
     }
 
     static show() {
         fetchContainers();
         document.documentElement.classList.remove('ui__hidden');
         containers.visible = true;
     }
 
     static hide() {
         fetchContainers();
         document.documentElement.classList.add('ui__hidden');
         containers.visible = false;
     }
 
     static addSet(set: uiSet) {
         fetchContainers();
         containers.menus.prepend(set.dom);
     }
 
     static removeSet(set: uiSet) {
         fetchContainers();
         containers.menus.removeChild(set.dom);
     }
 
     static clear() {
         for (let i = STATIC_UI_ITEMS; i < uiSets.length; i++) {
             containers.menus.removeChild(uiSets[i].dom);
         }
         uiSets.splice(STATIC_UI_ITEMS, uiSets.length - STATIC_UI_ITEMS);
     }
 
 
     static visible(): boolean {
         return containers.visible;
     }
 }
 