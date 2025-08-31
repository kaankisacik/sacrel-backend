import { MedusaService } from "@medusajs/framework/utils"
import { UiMedia } from "./models/ui-media"

class UiMediaModuleService extends MedusaService({
  UiMedia,
}) {}

export default UiMediaModuleService
