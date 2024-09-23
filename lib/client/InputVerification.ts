export const ValidRegex = /^[0-9a-z]+$/;
export const ValidRegexWithSpaces = /^[0-9a-z ]+$/;
export const MinimumNameLength = 3;

export function validName(name: string, allowSpaces: boolean = false): boolean {
  if (!name.match(allowSpaces ? ValidRegexWithSpaces : ValidRegex)) {
    return false;
  }

  if (name.length < MinimumNameLength) {
    return false;
  }

  return true;
}

export function validEmail(email: string): boolean {
  if (
    !email.match(
      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    )
  ) {
    return false;
  }
  return true;
}
