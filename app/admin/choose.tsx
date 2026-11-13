'use client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function Choose({ value, onChange, options, label, disabledOptions = [], optionLabel }: { value: string; onChange: (x: string) => void; options: string[]; label: string; disabledOptions?: string[]; optionLabel?: (x: string) => string }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="choice"><SelectValue placeholder={label} /></SelectTrigger>
      <SelectContent>{options.map((x) => <SelectItem key={x} value={x} disabled={disabledOptions.includes(x)}>{optionLabel ? optionLabel(x) : x}</SelectItem>)}</SelectContent>
    </Select>
  );
}
