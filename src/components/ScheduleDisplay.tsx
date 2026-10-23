import React from 'react';

interface ScheduleDisplayProps<T> {
  schedule: T | null;
  scheduleLoaded: boolean;
  renderSchedule: (schedule: T) => React.ReactNode;
  /** Optional custom message shown when the schedule is not yet released. */
  notReleasedMessage?: string;
}

/**
 * ScheduleDisplay
 *
 * Renders the match schedule, a loading spinner while fetching, or an
 * informative message when the schedule has not been released yet.
 *
 * Resolves issue #200: previously an infinite spinner was shown when the
 * schedule simply hadn't been published yet.
 */
export function ScheduleDisplay<T>({
  schedule,
  scheduleLoaded,
  renderSchedule,
  notReleasedMessage = 'The match schedule has not been released yet. Check back closer to the event!',
}: ScheduleDisplayProps<T>) {
  if (!scheduleLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
          aria-label="Loading schedule"
        />
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500 italic text-center">{notReleasedMessage}</p>
      </div>
    );
  }

  return <>{renderSchedule(schedule)}</>;
}
