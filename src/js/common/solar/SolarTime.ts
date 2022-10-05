const SEC_TO_HOURS = 1 / 3600;

class SolarTime {
    private _d:number;

    get d():number {
        return this.getDonDate();
    }

    get MJD():number {
        return this.getMJDonDate();
    }

    getDonDate(date:Date=new Date()):number {
        const d = date;
        const y = d.getFullYear();
        const m = d.getMonth();
        const D = d.getDate();
        const UT = Date.UTC(y, m, D, d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()) * .001 * SEC_TO_HOURS;
        this._d = 367*y - 7 * ( y + (m+9)/12 ) / 4 - 3 * ( ( y + (m-9)/7 ) / 100 + 1 ) / 4 + 275*m/9 + D - 730515
        this._d += UT/24.0;

        return this._d;
    }

    getMJDonDate(date:Date=new Date()):number {
        const d = date;
        const unixSecs = d.getTime() * .001;
        const JD = (unixSecs / 86400.0) + 2440587.5; // Julian Days
        const MJD = JD2MJD(JD);

        this._d = MJD;

        return this._d;
    }
}

export function JD2MJD(jd:number): number {
    return jd - 2400000.5;
}

export function MJD2JD(mjd:number): number {
    return mjd + 2400000.5;
}

export const SolarTimeManager = new SolarTime();