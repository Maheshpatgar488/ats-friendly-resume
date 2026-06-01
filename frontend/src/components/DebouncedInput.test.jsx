import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DebouncedInput, DebouncedTextarea } from './DebouncedInput';
import React from 'react';

describe('DebouncedInput', () => {
  it('renders input with initial value', () => {
    render(<DebouncedInput value="initial" onChange={() => {}} />);
    expect(screen.getByDisplayValue('initial')).toBeInTheDocument();
  });

  it('debounces the onChange call', async () => {
    vi.useFakeTimers();
    const handleChange = vi.fn();
    render(<DebouncedInput value="" onChange={handleChange} debounceTime={300} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'typing' } });
    
    // Initially not called
    expect(handleChange).not.toHaveBeenCalled();
    
    // Advance timer
    vi.advanceTimersByTime(300);
    
    // Now it should be called
    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
      target: expect.objectContaining({ value: 'typing' })
    }));
    
    vi.useRealTimers();
  });

  it('updates when external value prop changes', () => {
    const { rerender } = render(<DebouncedInput value="first" onChange={() => {}} />);
    expect(screen.getByDisplayValue('first')).toBeInTheDocument();
    
    rerender(<DebouncedInput value="second" onChange={() => {}} />);
    expect(screen.getByDisplayValue('second')).toBeInTheDocument();
  });
});

describe('DebouncedTextarea', () => {
  it('renders textarea with initial value', () => {
    render(<DebouncedTextarea value="initial text" onChange={() => {}} />);
    expect(screen.getByDisplayValue('initial text')).toBeInTheDocument();
  });

  it('debounces the onChange call', async () => {
    vi.useFakeTimers();
    const handleChange = vi.fn();
    render(<DebouncedTextarea value="" onChange={handleChange} debounceTime={300} />);
    
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'typing' } });
    
    expect(handleChange).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
      target: expect.objectContaining({ value: 'typing' })
    }));
    
    vi.useRealTimers();
  });
});
