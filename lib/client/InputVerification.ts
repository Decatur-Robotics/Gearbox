export const ValidRegex = /^[0-9a-z]+$/;
export const MinimumNameLength = 3;

export function validName(name: string): boolean {
    if (!name.match(/^[a-z ,.'-]+$/i)) {
        console.log("eee")
        return false;
    }

    if(name.length < 3) {
        return false;
    }

    return true;
}

export function validEmail(email: string): boolean {
    if(!email.match(
        /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    )) {
        return false
    }

    return true
}