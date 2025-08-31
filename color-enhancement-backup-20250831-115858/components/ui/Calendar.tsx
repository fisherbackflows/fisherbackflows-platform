'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';

interface AvailableDate {
  date: string;
  dayOfWeek: string;
  availableSlots: Array<{
    time: string;
    period: 'morning' | 'afternoon';
  }>;
}

interface CalendarProps {
  availableDates: AvailableDate[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
  preferredTime: 'morning' | 'afternoon' | 'flexible';
}

export default function Calendar({ availableDates, selectedDate, onDateSelect, preferredTime }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Get the first day of the month and how many days in the month
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();
  
  // Month/year navigation
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  // Check if a date has availability
  const getDateAvailability = (day: number) => {
    const dateString = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      .toISOString().split('T')[0];
    
    if (!availableDates || availableDates.length === 0) {
      return { available: false, slots: 0 };
    }
    
    const availableDate = availableDates.find(d => d.date === dateString);
    if (!availableDate) return { available: false, slots: 0 };
    
    // Filter slots based on time preference
    const relevantSlots = preferredTime === 'flexible' 
      ? availableDate.availableSlots
      : availableDate.availableSlots.filter(slot => slot.period === preferredTime);
    
    return {
      available: relevantSlots.length > 0,
      slots: relevantSlots.length,
      totalSlots: availableDate.availableSlots.length
    };
  };
  
  // Check if date is today or in the past
  const isDateDisabled = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Check if date is today
  const isToday = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };
  
  // Generate calendar grid
  const calendarDays = [];
  
  // Empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="p-2"></div>);
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateString = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      .toISOString().split('T')[0];
    
    const availability = getDateAvailability(day);
    const isSelected = selectedDate === dateString;
    const isDisabled = isDateDisabled(day);
    const isAvailable = availability.available && !isDisabled;
    const todayIndicator = isToday(day);
    
    calendarDays.push(
      <button
        key={day}
        onClick={() => isAvailable && onDateSelect(dateString)}
        disabled={!isAvailable}
        className={`
          relative p-1 text-sm rounded-lg transition-all font-bold aspect-square flex flex-col items-center justify-center min-h-[44px] w-full
          ${isSelected 
            ? 'bg-blue-600 text-white ring-2 ring-blue-400 shadow-lg shadow-blue-500/50' 
            : todayIndicator && isAvailable
              ? 'bg-blue-500/40 text-white hover:bg-blue-500/60 ring-2 ring-blue-400/60 shadow-md shadow-blue-500/30'
            : isAvailable
              ? 'bg-blue-400/30 text-white hover:bg-blue-500/50 shadow-sm shadow-blue-500/20' 
              : 'text-white/40 cursor-not-allowed bg-gray-700/20'
          }
        `}
      >
        <span className="text-xs font-bold">{day}</span>
        {isAvailable && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
            <div className={`w-2 h-2 rounded-full shadow-lg ${
              availability.slots >= 5 ? 'bg-emerald-400 shadow-emerald-400/50' :
              availability.slots >= 3 ? 'bg-amber-400 shadow-amber-400/50' :
              'bg-orange-500 shadow-orange-500/50'
            }`}></div>
          </div>
        )}
      </button>
    );
  }
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <div className="glass rounded-2xl p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          onClick={goToPreviousMonth}
          className="btn-glass p-2 rounded-lg"
          disabled={currentMonth.getMonth() <= new Date().getMonth() && currentMonth.getFullYear() <= new Date().getFullYear()}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <h2 className="text-xl font-bold text-white">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        
        <Button
          onClick={goToNextMonth}
          className="btn-glass p-2 rounded-lg"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-center text-sm font-medium text-white/60 p-1">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays}
      </div>
      
      {/* Legend */}
      <div className="mt-6 flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-emerald-400 rounded-full shadow-lg shadow-emerald-400/50"></div>
          <span className="text-white/90 font-medium">5+ slots</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-amber-400 rounded-full shadow-lg shadow-amber-400/50"></div>
          <span className="text-white/90 font-medium">3-4 slots</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-orange-500 rounded-full shadow-lg shadow-orange-500/50"></div>
          <span className="text-white/90 font-medium">1-2 slots</span>
        </div>
      </div>
      
      {/* Selected Date Info */}
      {selectedDate && (
        <div className="mt-4 glass-blue rounded-lg p-4 ring-1 ring-blue-400/50 shadow-lg shadow-blue-500/20">
          <div className="text-center">
            <p className="text-blue-300 font-bold text-lg">
              {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            {(() => {
              const availability = getDateAvailability(new Date(selectedDate).getDate());
              return (
                <p className="text-white/90 text-sm mt-1 font-medium">
                  {availability.slots} {preferredTime === 'flexible' ? 'total' : preferredTime} slots available
                </p>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}