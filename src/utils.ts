// Utility functions

class Utils {
    static csToPixel(cs: number): number {
        return 64 * (1 - 0.7 * (cs - 5) / 5) / 2;
    }

    static arToMilliseconds(ar: number): number {
        if (ar <= 5) {
            return 1800 - (ar * 120);
        } else {
            return 1950 - (ar * 150);
        }
    }

    static msToTimestamp(ms: number): string {  // eg. 65546 -> 01:05:546
        var [seconds, milliseconds] = this.divmod(ms, 1000);
        var [minutes, seconds] = this.divmod(seconds, 60);
        milliseconds = Math.round(milliseconds);
        return `${this.padZeros(minutes, 2)}:${this.padZeros(seconds, 2)}:${this.padZeros(milliseconds, 3)}`;
    }

    static divmod(value: number, divisor: number): [number, number] {
        let quotient = Math.floor(value / divisor);
        let remainder = value % divisor;
        return [quotient, remainder];
    }

    static padZeros(value: number, digits: number): string {
        var result = value.toString();
        while (result.length < digits) {
            result = "0" + result;
        }
        return result;
    }
}

export default Utils;
