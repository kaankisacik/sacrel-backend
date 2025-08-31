import UiMediaModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const UI_MEDIA_MODULE = "uiMedia"

export default Module(UI_MEDIA_MODULE, {
  service: UiMediaModuleService,
})
