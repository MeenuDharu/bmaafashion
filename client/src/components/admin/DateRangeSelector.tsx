import { useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface DateRangeOption {
  value: string;
  label: string;
}

interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  customRange?: DateRange;
  onCustomRangeChange: (range: DateRange | undefined) => void;
  options: readonly DateRangeOption[];
  className?: string;
  "data-testid"?: string;
}

export function DateRangeSelector({
  value,
  onChange,
  customRange,
  onCustomRangeChange,
  options,
  className,
  "data-testid": testId
}: DateRangeSelectorProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>(customRange);

  const handleQuickSelect = (optionValue: string) => {
    if (optionValue === "custom") {
      setIsCalendarOpen(true);
    } else {
      onChange(optionValue);
      onCustomRangeChange(undefined);
    }
  };

  const handleCustomRangeApply = () => {
    if (tempDateRange && tempDateRange.from && tempDateRange.to) {
      onCustomRangeChange(tempDateRange);
      onChange("custom");
      setIsCalendarOpen(false);
    }
  };

  const handleCustomRangeCancel = () => {
    setTempDateRange(customRange);
    setIsCalendarOpen(false);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    if (!tempDateRange?.from || (tempDateRange.from && tempDateRange.to)) {
      // Start new range
      setTempDateRange({ from: date, to: date });
    } else if (tempDateRange.from && !tempDateRange.to) {
      // Complete the range
      if (date >= tempDateRange.from) {
        setTempDateRange({ from: tempDateRange.from, to: date });
      } else {
        setTempDateRange({ from: date, to: tempDateRange.from });
      }
    }
  };

  const getDisplayText = () => {
    if (value === "custom" && customRange) {
      return `${format(customRange.from, "MMM dd")} - ${format(customRange.to, "MMM dd")}`;
    }
    return options.find(option => option.value === value)?.label || "Select range";
  };

  const isRangeComplete = tempDateRange?.from && tempDateRange?.to;

  return (
    <div className={`flex items-center gap-2 ${className}`} data-testid={testId}>
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Date Range:</span>
      </div>

      {/* Quick Select Options */}
      <div className="flex items-center gap-1">
        {options.filter(option => option.value !== "custom").map((option) => (
          <Button
            key={option.value}
            variant={value === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => handleQuickSelect(option.value)}
            data-testid={`quick-select-${option.value}`}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* Custom Range Picker */}
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={value === "custom" ? "default" : "outline"}
            size="sm"
            onClick={() => setIsCalendarOpen(true)}
            data-testid="button-custom-range"
          >
            Custom Range
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4 space-y-4">
            <div>
              <h4 className="font-medium mb-2">Select Date Range</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Choose start and end dates for your custom range
              </p>
            </div>

            <Calendar
              mode="range"
              selected={tempDateRange}
              onSelect={(range) => {
                if (range?.from) {
                  handleDateSelect(range.from);
                  if (range.to && range.to !== range.from) {
                    handleDateSelect(range.to);
                  }
                }
              }}
              numberOfMonths={2}
              className="border rounded-md"
              data-testid="custom-date-calendar"
            />

            {tempDateRange && (
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Selected Range:</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    From: {tempDateRange.from ? format(tempDateRange.from, "MMM dd, yyyy") : "Not selected"}
                  </Badge>
                  <Badge variant="outline">
                    To: {tempDateRange.to ? format(tempDateRange.to, "MMM dd, yyyy") : "Not selected"}
                  </Badge>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <Button
                size="sm"
                onClick={handleCustomRangeApply}
                disabled={!isRangeComplete}
                data-testid="button-apply-custom-range"
              >
                Apply Range
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCustomRangeCancel}
                data-testid="button-cancel-custom-range"
              >
                Cancel
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Display Current Selection */}
      {value && (
        <Badge variant="outline" className="text-xs">
          {getDisplayText()}
        </Badge>
      )}
    </div>
  );
}