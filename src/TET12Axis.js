import { Scale } from "chart.js";
import { notes } from "./PitchChart.js";


const _12TH_ROOT_OF_2 = Math.pow(2, 1/12);

function log12thRootOf2(val) {
    return Math.log(val)/Math.log(_12TH_ROOT_OF_2);
}

// https://stackoverflow.com/a/68192529/10367549
export class TET12Axis extends Scale {
    constructor(cfg) {
        super(cfg);
        this._startValue = undefined;
        this._valueRange = 0;
    }

    // parse(raw, index) {
    //     const value = LinearScale.prototype.parse.apply(this, [raw, index]);
    //     return isFinite(value) && value > 0 ? value : null;
    // }

    getPixelForValue(value) {
        if (value === undefined || value === 0) {
            value = this.min;
        }

        return this.getPixelForDecimal(value === this.min ? 0 :
                                       (log12thRootOf2(value) - this._startValue)/this._valueRange);
    }

    getValueForPixel(pixel) {
        const decimal = this.getDecimalForPixel(pixel);
        return Math.pow(_12TH_ROOT_OF_2, this._startValue + decimal*this._valueRange);
    }

    /**
     * @protected
     */
    configure() {
        const start = this.min;

        super.configure();

        this._startValue = log12thRootOf2(start);
        this._valueRange = log12thRootOf2(this.max) - log12thRootOf2(start);
    }

    determineDataLimits() {
        const {
            min,
            max,
        } = this.getMinMax(true);
        this.min = isFinite(min) ? Math.max(0, min) : null;
        this.max = isFinite(max) ? Math.max(0, max) : null;
    }

    buildTicks() {
        return notes.map(({ frequency }) => ({ value: frequency }));
    }
}

TET12Axis.id = "tet-12";
TET12Axis.defaults = {};

