

export const MonthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

export function MonthString(timestamp: number): string {
    // returns Month Day, Year
    const d = new Date(timestamp);
    const day = d.getDay() > 0 ? ` ${d.getDay()}` : ""
    return `${MonthNames[d.getMonth()]}${day}, ${d.getFullYear()}`
}