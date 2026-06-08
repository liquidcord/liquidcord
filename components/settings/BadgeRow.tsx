import { Button } from "@components/Button";
import { Flex } from "@components/Flex";
import { React, Select } from "@webpack/common";
import { REAL_DISCORD_BADGES, resolveBadgeType } from "../../constants";

interface Props {
  type: string;
  index: number;
  onChange: (idx: number, nextType: string) => void;
  onRemove: (idx: number) => void;
}

export function BadgeRow({ type, index, onChange, onRemove }: Props) {
  const options = REAL_DISCORD_BADGES.map((rb, i) => ({
    key: String(i),
    value: rb.type,
    label: rb.description,
  }));

  const resolved = resolveBadgeType(type);
  const iconSrc = resolved?.iconSrc;

  return (
    <div style={{ border: "1px solid var(--background-modifier-accent)", borderRadius: 6, padding: 12, marginBottom: 8 }}>
      <Flex style={{ gap: 8, alignItems: "center" }}>
        {iconSrc && (
          <img src={iconSrc} alt="" style={{ width: 22, height: 22, borderRadius: 3, flexShrink: 0 }} />
        )}
        <div style={{ flex: 1 }}>
          <Select
            options={options}
            placeholder="Select a badge"
            select={(value: string) => onChange(index, value)}
            isSelected={(value: string) => value === type}
            closeOnSelect={true}
            serialize={(v: any) => v}
          />
        </div>
        <Button color="red" size="small" onClick={() => onRemove(index)}>
          Remove
        </Button>
      </Flex>
    </div>
  );
}
