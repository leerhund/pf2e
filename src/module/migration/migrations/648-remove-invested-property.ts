import { ItemSourcePF2e } from "@item/data";
import { PhysicalSystemData } from "@item/physical/data";
import { MigrationBase } from "../base";

/** Remove the `invested` property from uninvestable item types */
export class Migration648RemoveInvestedProperty extends MigrationBase {
    static override version = 0.648;

    override async updateItem(itemSource: ItemSourcePF2e): Promise<void> {
        if (!(itemSource.type === "treasure" || itemSource.type === "consumable")) return;
        const systemData: NotInvestableData = itemSource.data;
        delete systemData.invested;
        if ("game" in globalThis) {
            systemData["-=invested"] = null;
        }
    }
}

interface NotInvestableData extends PhysicalSystemData {
    "-=invested"?: null;
}