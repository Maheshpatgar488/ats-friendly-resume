import React from "react";

export function DebouncedInput({ value, onChange, debounceTime = 300, ...props }) {
  const [localValue, setLocalValue] = React.useState(value || "");
  const onChangeRef = React.useRef(onChange);
  
  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  
  React.useEffect(() => {
    setLocalValue(value || "");
  }, [value]);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (localValue !== (value || "")) {
        onChangeRef.current({ target: { value: localValue } });
      }
    }, debounceTime);
    return () => clearTimeout(handler);
  }, [localValue, value, debounceTime]);

  const handleBlur = () => {
    if (localValue !== (value || "")) {
      onChangeRef.current({ target: { value: localValue } });
    }
  };

  return <input value={localValue} onChange={(e) => setLocalValue(e.target.value)} onBlur={handleBlur} {...props} />;
}

export function DebouncedTextarea({ value, onChange, debounceTime = 300, ...props }) {
  const [localValue, setLocalValue] = React.useState(value || "");
  const onChangeRef = React.useRef(onChange);
  
  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  
  React.useEffect(() => {
    setLocalValue(value || "");
  }, [value]);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (localValue !== (value || "")) {
        onChangeRef.current({ target: { value: localValue } });
      }
    }, debounceTime);
    return () => clearTimeout(handler);
  }, [localValue, value, debounceTime]);

  const handleBlur = () => {
    if (localValue !== (value || "")) {
      onChangeRef.current({ target: { value: localValue } });
    }
  };

  return <textarea value={localValue} onChange={(e) => setLocalValue(e.target.value)} onBlur={handleBlur} {...props} />;
}
