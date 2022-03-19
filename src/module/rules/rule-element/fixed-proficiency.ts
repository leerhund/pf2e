import { RuleElementPF2e, RuleElementData } from "./";
import { CharacterPF2e, NPCPF2e } from "@actor";
import { AbilityString, ActorType } from "@actor/data";
import { ABILITY_ABBREVIATIONS, SKILL_EXPANDED } from "@actor/data/values";
import { ModifierPF2e, MODIFIER_TYPE, StatisticModifier } from "@actor/modifiers";
import { objectHasKey, setHasElement } from "@util";

const KNOWN_TARGETS: Record<string, { ability: AbilityString; shortform: "ac" }> = {
    ac: { ability: "dex" as const, shortform: "ac" },
};

/**
 * @category RuleElement
 */
export class FixedProficiencyRuleElement extends RuleElementPF2e {
    protected static override validActorTypes: ActorType[] = ["character", "npc"];

    override beforePrepareData(): void {
        const selector = this.resolveInjectedProperties(this.data.selector);
        let value = Number(this.resolveValue(this.data.value)) || 0;
        if (selector === "ac") {
            // Special case for AC so the rule elements match what's written in the book
            value -= 10;
        }

        const ability =
            (this.data.ability && String(this.data.ability).trim()) ||
            (KNOWN_TARGETS[selector]?.ability ?? SKILL_EXPANDED[selector]?.ability);

        if (!setHasElement(ABILITY_ABBREVIATIONS, ability)) {
            console.warn("PF2E | Fixed modifier requires an ability field, or a known selector.");
        } else if (!value) {
            console.warn("PF2E | Fixed modifier requires at least a non-zero value or formula field.");
        } else {
            const modifier = new ModifierPF2e(
                this.label,
                value - this.actor.data.data.abilities[ability].mod,
                MODIFIER_TYPE.PROFICIENCY
            );
            const modifiers = (this.actor.synthetics.statisticsModifiers[selector] ??= []);
            modifiers.push(() => modifier);
        }
    }

    override afterPrepareData() {
        const selector = this.resolveInjectedProperties(this.data.selector);
        const { data } = this.actor.data;
        const skill: string = SKILL_EXPANDED[selector]?.shortform ?? selector;
        const skills: Record<string, StatisticModifier> = data.skills;
        const target = skills[skill] ?? (objectHasKey(data.attributes, skill) ? data.attributes[skill] : null);
        const force = this.data.force;

        if (target instanceof StatisticModifier) {
            for (const modifier of target.modifiers) {
                const itemOrUntyped: string[] = [MODIFIER_TYPE.ITEM, MODIFIER_TYPE.UNTYPED];
                if (itemOrUntyped.includes(modifier.type) && modifier.modifier > 0) {
                    modifier.ignored = true;
                }
                if (force && modifier.type === MODIFIER_TYPE.PROFICIENCY && modifier.slug !== this.label) {
                    modifier.ignored = true;
                }
            }
            target.calculateTotal();
            target.value = target.totalModifier + (skill === "ac" ? 10 : 0);
        }
    }
}

export interface FixedProficiencyRuleElement {
    data: RuleElementData & {
        name?: string;
        ability?: string;
        force?: boolean;
    };

    get actor(): CharacterPF2e | NPCPF2e;
}
