"use strict";
frappe.provide("itrostack.material");
  //Code for Material Color Generation from google
  //refer https://www.npmjs.com/package/@material/material-color-utilities for details.
  function signum(num) {
    if (num < 0) {
      return -1;
    } else if (num === 0) {
      return 0;
    } else {
      return 1;
    }
  }
  function lerp(start, stop, amount) {
    return (1 - amount) * start + amount * stop;
  }
  function clampInt(min, max, input) {
    if (input < min) {
      return min;
    } else if (input > max) {
      return max;
    }
    return input;
  }
  function clampDouble(min, max, input) {
    if (input < min) {
      return min;
    } else if (input > max) {
      return max;
    }
    return input;
  }
  function sanitizeDegreesInt(degrees) {
    degrees = degrees % 360;
    if (degrees < 0) {
      degrees = degrees + 360;
    }
    return degrees;
  }
  function sanitizeDegreesDouble(degrees) {
    degrees = degrees % 360;
    if (degrees < 0) {
      degrees = degrees + 360;
    }
    return degrees;
  }
  function rotationDirection(from, to) {
    const increasingDifference = sanitizeDegreesDouble(to - from);
    return increasingDifference <= 180 ? 1 : -1;
  }
  function differenceDegrees(a, b) {
    return 180 - Math.abs(Math.abs(a - b) - 180);
  }
  function matrixMultiply(row, matrix) {
    const a = row[0] * matrix[0][0] + row[1] * matrix[0][1] + row[2] * matrix[0][2];
    const b = row[0] * matrix[1][0] + row[1] * matrix[1][1] + row[2] * matrix[1][2];
    const c = row[0] * matrix[2][0] + row[1] * matrix[2][1] + row[2] * matrix[2][2];
    return [a, b, c];
  }

  // utils/color_utils.js
  var SRGB_TO_XYZ = [
    [0.41233895, 0.35762064, 0.18051042],
    [0.2126, 0.7152, 0.0722],
    [0.01932141, 0.11916382, 0.95034478]
  ];
  var XYZ_TO_SRGB = [
    [
      3.2413774792388685,
      -1.5376652402851851,
      -0.49885366846268053
    ],
    [
      -0.9691452513005321,
      1.8758853451067872,
      0.04156585616912061
    ],
    [
      0.05562093689691305,
      -0.20395524564742123,
      1.0571799111220335
    ]
  ];
  var WHITE_POINT_D65 = [95.047, 100, 108.883];
  function argbFromRgb(red, green, blue) {
    return (255 << 24 | (red & 255) << 16 | (green & 255) << 8 | blue & 255) >>> 0;
  }
  function argbFromLinrgb(linrgb) {
    const r = delinearized(linrgb[0]);
    const g = delinearized(linrgb[1]);
    const b = delinearized(linrgb[2]);
    return argbFromRgb(r, g, b);
  }
  function alphaFromArgb(argb) {
    return argb >> 24 & 255;
  }
  function redFromArgb(argb) {
    return argb >> 16 & 255;
  }
  function greenFromArgb(argb) {
    return argb >> 8 & 255;
  }
  function blueFromArgb(argb) {
    return argb & 255;
  }
  function isOpaque(argb) {
    return alphaFromArgb(argb) >= 255;
  }
  function argbFromXyz(x, y, z) {
    const matrix = XYZ_TO_SRGB;
    const linearR = matrix[0][0] * x + matrix[0][1] * y + matrix[0][2] * z;
    const linearG = matrix[1][0] * x + matrix[1][1] * y + matrix[1][2] * z;
    const linearB = matrix[2][0] * x + matrix[2][1] * y + matrix[2][2] * z;
    const r = delinearized(linearR);
    const g = delinearized(linearG);
    const b = delinearized(linearB);
    return argbFromRgb(r, g, b);
  }
  function xyzFromArgb(argb) {
    const r = linearized(redFromArgb(argb));
    const g = linearized(greenFromArgb(argb));
    const b = linearized(blueFromArgb(argb));
    return matrixMultiply([r, g, b], SRGB_TO_XYZ);
  }
  function argbFromLab(l, a, b) {
    const whitePoint = WHITE_POINT_D65;
    const fy = (l + 16) / 116;
    const fx = a / 500 + fy;
    const fz = fy - b / 200;
    const xNormalized = labInvf(fx);
    const yNormalized = labInvf(fy);
    const zNormalized = labInvf(fz);
    const x = xNormalized * whitePoint[0];
    const y = yNormalized * whitePoint[1];
    const z = zNormalized * whitePoint[2];
    return argbFromXyz(x, y, z);
  }
  function labFromArgb(argb) {
    const linearR = linearized(redFromArgb(argb));
    const linearG = linearized(greenFromArgb(argb));
    const linearB = linearized(blueFromArgb(argb));
    const matrix = SRGB_TO_XYZ;
    const x = matrix[0][0] * linearR + matrix[0][1] * linearG + matrix[0][2] * linearB;
    const y = matrix[1][0] * linearR + matrix[1][1] * linearG + matrix[1][2] * linearB;
    const z = matrix[2][0] * linearR + matrix[2][1] * linearG + matrix[2][2] * linearB;
    const whitePoint = WHITE_POINT_D65;
    const xNormalized = x / whitePoint[0];
    const yNormalized = y / whitePoint[1];
    const zNormalized = z / whitePoint[2];
    const fx = labF(xNormalized);
    const fy = labF(yNormalized);
    const fz = labF(zNormalized);
    const l = 116 * fy - 16;
    const a = 500 * (fx - fy);
    const b = 200 * (fy - fz);
    return [l, a, b];
  }
  function argbFromLstar(lstar) {
    const y = yFromLstar(lstar);
    const component = delinearized(y);
    return argbFromRgb(component, component, component);
  }
  function lstarFromArgb(argb) {
    const y = xyzFromArgb(argb)[1];
    return 116 * labF(y / 100) - 16;
  }
  function yFromLstar(lstar) {
    return 100 * labInvf((lstar + 16) / 116);
  }
  function lstarFromY(y) {
    return labF(y / 100) * 116 - 16;
  }
  function linearized(rgbComponent) {
    const normalized = rgbComponent / 255;
    if (normalized <= 0.040449936) {
      return normalized / 12.92 * 100;
    } else {
      return Math.pow((normalized + 0.055) / 1.055, 2.4) * 100;
    }
  }
  function delinearized(rgbComponent) {
    const normalized = rgbComponent / 100;
    let delinearized2 = 0;
    if (normalized <= 31308e-7) {
      delinearized2 = normalized * 12.92;
    } else {
      delinearized2 = 1.055 * Math.pow(normalized, 1 / 2.4) - 0.055;
    }
    return clampInt(0, 255, Math.round(delinearized2 * 255));
  }
  function whitePointD65() {
    return WHITE_POINT_D65;
  }
  function labF(t) {
    const e = 216 / 24389;
    const kappa = 24389 / 27;
    if (t > e) {
      return Math.pow(t, 1 / 3);
    } else {
      return (kappa * t + 16) / 116;
    }
  }
  function labInvf(ft) {
    const e = 216 / 24389;
    const kappa = 24389 / 27;
    const ft3 = ft * ft * ft;
    if (ft3 > e) {
      return ft3;
    } else {
      return (116 * ft - 16) / kappa;
    }
  }

  // hct/viewing_conditions.js
  var ViewingConditions = class _ViewingConditions {
    /**
     * Create ViewingConditions from a simple, physically relevant, set of
     * parameters.
     *
     * @param whitePoint White point, measured in the XYZ color space.
     *     default = D65, or sunny day afternoon
     * @param adaptingLuminance The luminance of the adapting field. Informally,
     *     how bright it is in the room where the color is viewed. Can be
     *     calculated from lux by multiplying lux by 0.0586. default = 11.72,
     *     or 200 lux.
     * @param backgroundLstar The lightness of the area surrounding the color.
     *     measured by L* in L*a*b*. default = 50.0
     * @param surround A general description of the lighting surrounding the
     *     color. 0 is pitch dark, like watching a movie in a theater. 1.0 is a
     *     dimly light room, like watching TV at home at night. 2.0 means there
     *     is no difference between the lighting on the color and around it.
     *     default = 2.0
     * @param discountingIlluminant Whether the eye accounts for the tint of the
     *     ambient lighting, such as knowing an apple is still red in green light.
     *     default = false, the eye does not perform this process on
     *       self-luminous objects like displays.
     */
    static make(whitePoint = whitePointD65(), adaptingLuminance = 200 / Math.PI * yFromLstar(50) / 100, backgroundLstar = 50, surround = 2, discountingIlluminant = false) {
      const xyz = whitePoint;
      const rW = xyz[0] * 0.401288 + xyz[1] * 0.650173 + xyz[2] * -0.051461;
      const gW = xyz[0] * -0.250268 + xyz[1] * 1.204414 + xyz[2] * 0.045854;
      const bW = xyz[0] * -2079e-6 + xyz[1] * 0.048952 + xyz[2] * 0.953127;
      const f = 0.8 + surround / 10;
      const c = f >= 0.9 ? lerp(0.59, 0.69, (f - 0.9) * 10) : lerp(0.525, 0.59, (f - 0.8) * 10);
      let d = discountingIlluminant ? 1 : f * (1 - 1 / 3.6 * Math.exp((-adaptingLuminance - 42) / 92));
      d = d > 1 ? 1 : d < 0 ? 0 : d;
      const nc = f;
      const rgbD = [
        d * (100 / rW) + 1 - d,
        d * (100 / gW) + 1 - d,
        d * (100 / bW) + 1 - d
      ];
      const k = 1 / (5 * adaptingLuminance + 1);
      const k4 = k * k * k * k;
      const k4F = 1 - k4;
      const fl = k4 * adaptingLuminance + 0.1 * k4F * k4F * Math.cbrt(5 * adaptingLuminance);
      const n = yFromLstar(backgroundLstar) / whitePoint[1];
      const z = 1.48 + Math.sqrt(n);
      const nbb = 0.725 / Math.pow(n, 0.2);
      const ncb = nbb;
      const rgbAFactors = [
        Math.pow(fl * rgbD[0] * rW / 100, 0.42),
        Math.pow(fl * rgbD[1] * gW / 100, 0.42),
        Math.pow(fl * rgbD[2] * bW / 100, 0.42)
      ];
      const rgbA = [
        400 * rgbAFactors[0] / (rgbAFactors[0] + 27.13),
        400 * rgbAFactors[1] / (rgbAFactors[1] + 27.13),
        400 * rgbAFactors[2] / (rgbAFactors[2] + 27.13)
      ];
      const aw = (2 * rgbA[0] + rgbA[1] + 0.05 * rgbA[2]) * nbb;
      return new _ViewingConditions(n, aw, nbb, ncb, c, nc, rgbD, fl, Math.pow(fl, 0.25), z);
    }
    /**
     * Parameters are intermediate values of the CAM16 conversion process. Their
     * names are shorthand for technical color science terminology, this class
     * would not benefit from documenting them individually. A brief overview
     * is available in the CAM16 specification, and a complete overview requires
     * a color science textbook, such as Fairchild's Color Appearance Models.
     */
    constructor(n, aw, nbb, ncb, c, nc, rgbD, fl, fLRoot, z) {
      this.n = n;
      this.aw = aw;
      this.nbb = nbb;
      this.ncb = ncb;
      this.c = c;
      this.nc = nc;
      this.rgbD = rgbD;
      this.fl = fl;
      this.fLRoot = fLRoot;
      this.z = z;
    }
  };
  ViewingConditions.DEFAULT = ViewingConditions.make();

  // hct/cam16.js
  var Cam16 = class _Cam16 {
    /**
     * All of the CAM16 dimensions can be calculated from 3 of the dimensions, in
     * the following combinations:
     *      -  {j or q} and {c, m, or s} and hue
     *      - jstar, astar, bstar
     * Prefer using a static method that constructs from 3 of those dimensions.
     * This constructor is intended for those methods to use to return all
     * possible dimensions.
     *
     * @param hue
     * @param chroma informally, colorfulness / color intensity. like saturation
     *     in HSL, except perceptually accurate.
     * @param j lightness
     * @param q brightness; ratio of lightness to white point's lightness
     * @param m colorfulness
     * @param s saturation; ratio of chroma to white point's chroma
     * @param jstar CAM16-UCS J coordinate
     * @param astar CAM16-UCS a coordinate
     * @param bstar CAM16-UCS b coordinate
     */
    constructor(hue, chroma, j, q, m, s, jstar, astar, bstar) {
      this.hue = hue;
      this.chroma = chroma;
      this.j = j;
      this.q = q;
      this.m = m;
      this.s = s;
      this.jstar = jstar;
      this.astar = astar;
      this.bstar = bstar;
    }
    /**
     * CAM16 instances also have coordinates in the CAM16-UCS space, called J*,
     * a*, b*, or jstar, astar, bstar in code. CAM16-UCS is included in the CAM16
     * specification, and is used to measure distances between colors.
     */
    distance(other) {
      const dJ = this.jstar - other.jstar;
      const dA = this.astar - other.astar;
      const dB = this.bstar - other.bstar;
      const dEPrime = Math.sqrt(dJ * dJ + dA * dA + dB * dB);
      const dE = 1.41 * Math.pow(dEPrime, 0.63);
      return dE;
    }
    /**
     * @param argb ARGB representation of a color.
     * @return CAM16 color, assuming the color was viewed in default viewing
     *     conditions.
     */
    static fromInt(argb) {
      return _Cam16.fromIntInViewingConditions(argb, ViewingConditions.DEFAULT);
    }
    /**
     * @param argb ARGB representation of a color.
     * @param viewingConditions Information about the environment where the color
     *     was observed.
     * @return CAM16 color.
     */
    static fromIntInViewingConditions(argb, viewingConditions) {
      const red = (argb & 16711680) >> 16;
      const green = (argb & 65280) >> 8;
      const blue = argb & 255;
      const redL = linearized(red);
      const greenL = linearized(green);
      const blueL = linearized(blue);
      const x = 0.41233895 * redL + 0.35762064 * greenL + 0.18051042 * blueL;
      const y = 0.2126 * redL + 0.7152 * greenL + 0.0722 * blueL;
      const z = 0.01932141 * redL + 0.11916382 * greenL + 0.95034478 * blueL;
      const rC = 0.401288 * x + 0.650173 * y - 0.051461 * z;
      const gC = -0.250268 * x + 1.204414 * y + 0.045854 * z;
      const bC = -2079e-6 * x + 0.048952 * y + 0.953127 * z;
      const rD = viewingConditions.rgbD[0] * rC;
      const gD = viewingConditions.rgbD[1] * gC;
      const bD = viewingConditions.rgbD[2] * bC;
      const rAF = Math.pow(viewingConditions.fl * Math.abs(rD) / 100, 0.42);
      const gAF = Math.pow(viewingConditions.fl * Math.abs(gD) / 100, 0.42);
      const bAF = Math.pow(viewingConditions.fl * Math.abs(bD) / 100, 0.42);
      const rA = signum(rD) * 400 * rAF / (rAF + 27.13);
      const gA = signum(gD) * 400 * gAF / (gAF + 27.13);
      const bA = signum(bD) * 400 * bAF / (bAF + 27.13);
      const a = (11 * rA + -12 * gA + bA) / 11;
      const b = (rA + gA - 2 * bA) / 9;
      const u = (20 * rA + 20 * gA + 21 * bA) / 20;
      const p2 = (40 * rA + 20 * gA + bA) / 20;
      const atan2 = Math.atan2(b, a);
      const atanDegrees = atan2 * 180 / Math.PI;
      const hue = atanDegrees < 0 ? atanDegrees + 360 : atanDegrees >= 360 ? atanDegrees - 360 : atanDegrees;
      const hueRadians = hue * Math.PI / 180;
      const ac = p2 * viewingConditions.nbb;
      const j = 100 * Math.pow(ac / viewingConditions.aw, viewingConditions.c * viewingConditions.z);
      const q = 4 / viewingConditions.c * Math.sqrt(j / 100) * (viewingConditions.aw + 4) * viewingConditions.fLRoot;
      const huePrime = hue < 20.14 ? hue + 360 : hue;
      const eHue = 0.25 * (Math.cos(huePrime * Math.PI / 180 + 2) + 3.8);
      const p1 = 5e4 / 13 * eHue * viewingConditions.nc * viewingConditions.ncb;
      const t = p1 * Math.sqrt(a * a + b * b) / (u + 0.305);
      const alpha = Math.pow(t, 0.9) * Math.pow(1.64 - Math.pow(0.29, viewingConditions.n), 0.73);
      const c = alpha * Math.sqrt(j / 100);
      const m = c * viewingConditions.fLRoot;
      const s = 50 * Math.sqrt(alpha * viewingConditions.c / (viewingConditions.aw + 4));
      const jstar = (1 + 100 * 7e-3) * j / (1 + 7e-3 * j);
      const mstar = 1 / 0.0228 * Math.log(1 + 0.0228 * m);
      const astar = mstar * Math.cos(hueRadians);
      const bstar = mstar * Math.sin(hueRadians);
      return new _Cam16(hue, c, j, q, m, s, jstar, astar, bstar);
    }
    /**
     * @param j CAM16 lightness
     * @param c CAM16 chroma
     * @param h CAM16 hue
     */
    static fromJch(j, c, h) {
      return _Cam16.fromJchInViewingConditions(j, c, h, ViewingConditions.DEFAULT);
    }
    /**
     * @param j CAM16 lightness
     * @param c CAM16 chroma
     * @param h CAM16 hue
     * @param viewingConditions Information about the environment where the color
     *     was observed.
     */
    static fromJchInViewingConditions(j, c, h, viewingConditions) {
      const q = 4 / viewingConditions.c * Math.sqrt(j / 100) * (viewingConditions.aw + 4) * viewingConditions.fLRoot;
      const m = c * viewingConditions.fLRoot;
      const alpha = c / Math.sqrt(j / 100);
      const s = 50 * Math.sqrt(alpha * viewingConditions.c / (viewingConditions.aw + 4));
      const hueRadians = h * Math.PI / 180;
      const jstar = (1 + 100 * 7e-3) * j / (1 + 7e-3 * j);
      const mstar = 1 / 0.0228 * Math.log(1 + 0.0228 * m);
      const astar = mstar * Math.cos(hueRadians);
      const bstar = mstar * Math.sin(hueRadians);
      return new _Cam16(h, c, j, q, m, s, jstar, astar, bstar);
    }
    /**
     * @param jstar CAM16-UCS lightness.
     * @param astar CAM16-UCS a dimension. Like a* in L*a*b*, it is a Cartesian
     *     coordinate on the Y axis.
     * @param bstar CAM16-UCS b dimension. Like a* in L*a*b*, it is a Cartesian
     *     coordinate on the X axis.
     */
    static fromUcs(jstar, astar, bstar) {
      return _Cam16.fromUcsInViewingConditions(jstar, astar, bstar, ViewingConditions.DEFAULT);
    }
    /**
     * @param jstar CAM16-UCS lightness.
     * @param astar CAM16-UCS a dimension. Like a* in L*a*b*, it is a Cartesian
     *     coordinate on the Y axis.
     * @param bstar CAM16-UCS b dimension. Like a* in L*a*b*, it is a Cartesian
     *     coordinate on the X axis.
     * @param viewingConditions Information about the environment where the color
     *     was observed.
     */
    static fromUcsInViewingConditions(jstar, astar, bstar, viewingConditions) {
      const a = astar;
      const b = bstar;
      const m = Math.sqrt(a * a + b * b);
      const M = (Math.exp(m * 0.0228) - 1) / 0.0228;
      const c = M / viewingConditions.fLRoot;
      let h = Math.atan2(b, a) * (180 / Math.PI);
      if (h < 0) {
        h += 360;
      }
      const j = jstar / (1 - (jstar - 100) * 7e-3);
      return _Cam16.fromJchInViewingConditions(j, c, h, viewingConditions);
    }
    /**
     *  @return ARGB representation of color, assuming the color was viewed in
     *     default viewing conditions, which are near-identical to the default
     *     viewing conditions for sRGB.
     */
    toInt() {
      return this.viewed(ViewingConditions.DEFAULT);
    }
    /**
     * @param viewingConditions Information about the environment where the color
     *     will be viewed.
     * @return ARGB representation of color
     */
    viewed(viewingConditions) {
      const alpha = this.chroma === 0 || this.j === 0 ? 0 : this.chroma / Math.sqrt(this.j / 100);
      const t = Math.pow(alpha / Math.pow(1.64 - Math.pow(0.29, viewingConditions.n), 0.73), 1 / 0.9);
      const hRad = this.hue * Math.PI / 180;
      const eHue = 0.25 * (Math.cos(hRad + 2) + 3.8);
      const ac = viewingConditions.aw * Math.pow(this.j / 100, 1 / viewingConditions.c / viewingConditions.z);
      const p1 = eHue * (5e4 / 13) * viewingConditions.nc * viewingConditions.ncb;
      const p2 = ac / viewingConditions.nbb;
      const hSin = Math.sin(hRad);
      const hCos = Math.cos(hRad);
      const gamma = 23 * (p2 + 0.305) * t / (23 * p1 + 11 * t * hCos + 108 * t * hSin);
      const a = gamma * hCos;
      const b = gamma * hSin;
      const rA = (460 * p2 + 451 * a + 288 * b) / 1403;
      const gA = (460 * p2 - 891 * a - 261 * b) / 1403;
      const bA = (460 * p2 - 220 * a - 6300 * b) / 1403;
      const rCBase = Math.max(0, 27.13 * Math.abs(rA) / (400 - Math.abs(rA)));
      const rC = signum(rA) * (100 / viewingConditions.fl) * Math.pow(rCBase, 1 / 0.42);
      const gCBase = Math.max(0, 27.13 * Math.abs(gA) / (400 - Math.abs(gA)));
      const gC = signum(gA) * (100 / viewingConditions.fl) * Math.pow(gCBase, 1 / 0.42);
      const bCBase = Math.max(0, 27.13 * Math.abs(bA) / (400 - Math.abs(bA)));
      const bC = signum(bA) * (100 / viewingConditions.fl) * Math.pow(bCBase, 1 / 0.42);
      const rF = rC / viewingConditions.rgbD[0];
      const gF = gC / viewingConditions.rgbD[1];
      const bF = bC / viewingConditions.rgbD[2];
      const x = 1.86206786 * rF - 1.01125463 * gF + 0.14918677 * bF;
      const y = 0.38752654 * rF + 0.62144744 * gF - 897398e-8 * bF;
      const z = -0.0158415 * rF - 0.03412294 * gF + 1.04996444 * bF;
      const argb = argbFromXyz(x, y, z);
      return argb;
    }
    /// Given color expressed in XYZ and viewed in [viewingConditions], convert to
    /// CAM16.
    static fromXyzInViewingConditions(x, y, z, viewingConditions) {
      const rC = 0.401288 * x + 0.650173 * y - 0.051461 * z;
      const gC = -0.250268 * x + 1.204414 * y + 0.045854 * z;
      const bC = -2079e-6 * x + 0.048952 * y + 0.953127 * z;
      const rD = viewingConditions.rgbD[0] * rC;
      const gD = viewingConditions.rgbD[1] * gC;
      const bD = viewingConditions.rgbD[2] * bC;
      const rAF = Math.pow(viewingConditions.fl * Math.abs(rD) / 100, 0.42);
      const gAF = Math.pow(viewingConditions.fl * Math.abs(gD) / 100, 0.42);
      const bAF = Math.pow(viewingConditions.fl * Math.abs(bD) / 100, 0.42);
      const rA = signum(rD) * 400 * rAF / (rAF + 27.13);
      const gA = signum(gD) * 400 * gAF / (gAF + 27.13);
      const bA = signum(bD) * 400 * bAF / (bAF + 27.13);
      const a = (11 * rA + -12 * gA + bA) / 11;
      const b = (rA + gA - 2 * bA) / 9;
      const u = (20 * rA + 20 * gA + 21 * bA) / 20;
      const p2 = (40 * rA + 20 * gA + bA) / 20;
      const atan2 = Math.atan2(b, a);
      const atanDegrees = atan2 * 180 / Math.PI;
      const hue = atanDegrees < 0 ? atanDegrees + 360 : atanDegrees >= 360 ? atanDegrees - 360 : atanDegrees;
      const hueRadians = hue * Math.PI / 180;
      const ac = p2 * viewingConditions.nbb;
      const J = 100 * Math.pow(ac / viewingConditions.aw, viewingConditions.c * viewingConditions.z);
      const Q = 4 / viewingConditions.c * Math.sqrt(J / 100) * (viewingConditions.aw + 4) * viewingConditions.fLRoot;
      const huePrime = hue < 20.14 ? hue + 360 : hue;
      const eHue = 1 / 4 * (Math.cos(huePrime * Math.PI / 180 + 2) + 3.8);
      const p1 = 5e4 / 13 * eHue * viewingConditions.nc * viewingConditions.ncb;
      const t = p1 * Math.sqrt(a * a + b * b) / (u + 0.305);
      const alpha = Math.pow(t, 0.9) * Math.pow(1.64 - Math.pow(0.29, viewingConditions.n), 0.73);
      const C = alpha * Math.sqrt(J / 100);
      const M = C * viewingConditions.fLRoot;
      const s = 50 * Math.sqrt(alpha * viewingConditions.c / (viewingConditions.aw + 4));
      const jstar = (1 + 100 * 7e-3) * J / (1 + 7e-3 * J);
      const mstar = Math.log(1 + 0.0228 * M) / 0.0228;
      const astar = mstar * Math.cos(hueRadians);
      const bstar = mstar * Math.sin(hueRadians);
      return new _Cam16(hue, C, J, Q, M, s, jstar, astar, bstar);
    }
    /// XYZ representation of CAM16 seen in [viewingConditions].
    xyzInViewingConditions(viewingConditions) {
      const alpha = this.chroma === 0 || this.j === 0 ? 0 : this.chroma / Math.sqrt(this.j / 100);
      const t = Math.pow(alpha / Math.pow(1.64 - Math.pow(0.29, viewingConditions.n), 0.73), 1 / 0.9);
      const hRad = this.hue * Math.PI / 180;
      const eHue = 0.25 * (Math.cos(hRad + 2) + 3.8);
      const ac = viewingConditions.aw * Math.pow(this.j / 100, 1 / viewingConditions.c / viewingConditions.z);
      const p1 = eHue * (5e4 / 13) * viewingConditions.nc * viewingConditions.ncb;
      const p2 = ac / viewingConditions.nbb;
      const hSin = Math.sin(hRad);
      const hCos = Math.cos(hRad);
      const gamma = 23 * (p2 + 0.305) * t / (23 * p1 + 11 * t * hCos + 108 * t * hSin);
      const a = gamma * hCos;
      const b = gamma * hSin;
      const rA = (460 * p2 + 451 * a + 288 * b) / 1403;
      const gA = (460 * p2 - 891 * a - 261 * b) / 1403;
      const bA = (460 * p2 - 220 * a - 6300 * b) / 1403;
      const rCBase = Math.max(0, 27.13 * Math.abs(rA) / (400 - Math.abs(rA)));
      const rC = signum(rA) * (100 / viewingConditions.fl) * Math.pow(rCBase, 1 / 0.42);
      const gCBase = Math.max(0, 27.13 * Math.abs(gA) / (400 - Math.abs(gA)));
      const gC = signum(gA) * (100 / viewingConditions.fl) * Math.pow(gCBase, 1 / 0.42);
      const bCBase = Math.max(0, 27.13 * Math.abs(bA) / (400 - Math.abs(bA)));
      const bC = signum(bA) * (100 / viewingConditions.fl) * Math.pow(bCBase, 1 / 0.42);
      const rF = rC / viewingConditions.rgbD[0];
      const gF = gC / viewingConditions.rgbD[1];
      const bF = bC / viewingConditions.rgbD[2];
      const x = 1.86206786 * rF - 1.01125463 * gF + 0.14918677 * bF;
      const y = 0.38752654 * rF + 0.62144744 * gF - 897398e-8 * bF;
      const z = -0.0158415 * rF - 0.03412294 * gF + 1.04996444 * bF;
      return [x, y, z];
    }
  };

  // hct/hct_solver.js
  var HctSolver = class _HctSolver {
    /**
     * Sanitizes a small enough angle in radians.
     *
     * @param angle An angle in radians; must not deviate too much
     * from 0.
     * @return A coterminal angle between 0 and 2pi.
     */
    static sanitizeRadians(angle) {
      return (angle + Math.PI * 8) % (Math.PI * 2);
    }
    /**
     * Delinearizes an RGB component, returning a floating-point
     * number.
     *
     * @param rgbComponent 0.0 <= rgb_component <= 100.0, represents
     * linear R/G/B channel
     * @return 0.0 <= output <= 255.0, color channel converted to
     * regular RGB space
     */
    static trueDelinearized(rgbComponent) {
      const normalized = rgbComponent / 100;
      let delinearized2 = 0;
      if (normalized <= 31308e-7) {
        delinearized2 = normalized * 12.92;
      } else {
        delinearized2 = 1.055 * Math.pow(normalized, 1 / 2.4) - 0.055;
      }
      return delinearized2 * 255;
    }
    static chromaticAdaptation(component) {
      const af = Math.pow(Math.abs(component), 0.42);
      return signum(component) * 400 * af / (af + 27.13);
    }
    /**
     * Returns the hue of a linear RGB color in CAM16.
     *
     * @param linrgb The linear RGB coordinates of a color.
     * @return The hue of the color in CAM16, in radians.
     */
    static hueOf(linrgb) {
      const scaledDiscount = matrixMultiply(linrgb, _HctSolver.SCALED_DISCOUNT_FROM_LINRGB);
      const rA = _HctSolver.chromaticAdaptation(scaledDiscount[0]);
      const gA = _HctSolver.chromaticAdaptation(scaledDiscount[1]);
      const bA = _HctSolver.chromaticAdaptation(scaledDiscount[2]);
      const a = (11 * rA + -12 * gA + bA) / 11;
      const b = (rA + gA - 2 * bA) / 9;
      return Math.atan2(b, a);
    }
    static areInCyclicOrder(a, b, c) {
      const deltaAB = _HctSolver.sanitizeRadians(b - a);
      const deltaAC = _HctSolver.sanitizeRadians(c - a);
      return deltaAB < deltaAC;
    }
    /**
     * Solves the lerp equation.
     *
     * @param source The starting number.
     * @param mid The number in the middle.
     * @param target The ending number.
     * @return A number t such that lerp(source, target, t) = mid.
     */
    static intercept(source, mid, target) {
      return (mid - source) / (target - source);
    }
    static lerpPoint(source, t, target) {
      return [
        source[0] + (target[0] - source[0]) * t,
        source[1] + (target[1] - source[1]) * t,
        source[2] + (target[2] - source[2]) * t
      ];
    }
    /**
     * Intersects a segment with a plane.
     *
     * @param source The coordinates of point A.
     * @param coordinate The R-, G-, or B-coordinate of the plane.
     * @param target The coordinates of point B.
     * @param axis The axis the plane is perpendicular with. (0: R, 1:
     * G, 2: B)
     * @return The intersection point of the segment AB with the plane
     * R=coordinate, G=coordinate, or B=coordinate
     */
    static setCoordinate(source, coordinate, target, axis) {
      const t = _HctSolver.intercept(source[axis], coordinate, target[axis]);
      return _HctSolver.lerpPoint(source, t, target);
    }
    static isBounded(x) {
      return 0 <= x && x <= 100;
    }
    /**
     * Returns the nth possible vertex of the polygonal intersection.
     *
     * @param y The Y value of the plane.
     * @param n The zero-based index of the point. 0 <= n <= 11.
     * @return The nth possible vertex of the polygonal intersection
     * of the y plane and the RGB cube, in linear RGB coordinates, if
     * it exists. If this possible vertex lies outside of the cube,
     * [-1.0, -1.0, -1.0] is returned.
     */
    static nthVertex(y, n) {
      const kR = _HctSolver.Y_FROM_LINRGB[0];
      const kG = _HctSolver.Y_FROM_LINRGB[1];
      const kB = _HctSolver.Y_FROM_LINRGB[2];
      const coordA = n % 4 <= 1 ? 0 : 100;
      const coordB = n % 2 === 0 ? 0 : 100;
      if (n < 4) {
        const g = coordA;
        const b = coordB;
        const r = (y - g * kG - b * kB) / kR;
        if (_HctSolver.isBounded(r)) {
          return [r, g, b];
        } else {
          return [-1, -1, -1];
        }
      } else if (n < 8) {
        const b = coordA;
        const r = coordB;
        const g = (y - r * kR - b * kB) / kG;
        if (_HctSolver.isBounded(g)) {
          return [r, g, b];
        } else {
          return [-1, -1, -1];
        }
      } else {
        const r = coordA;
        const g = coordB;
        const b = (y - r * kR - g * kG) / kB;
        if (_HctSolver.isBounded(b)) {
          return [r, g, b];
        } else {
          return [-1, -1, -1];
        }
      }
    }
    /**
     * Finds the segment containing the desired color.
     *
     * @param y The Y value of the color.
     * @param targetHue The hue of the color.
     * @return A list of two sets of linear RGB coordinates, each
     * corresponding to an endpoint of the segment containing the
     * desired color.
     */
    static bisectToSegment(y, targetHue) {
      let left = [-1, -1, -1];
      let right = left;
      let leftHue = 0;
      let rightHue = 0;
      let initialized = false;
      let uncut = true;
      for (let n = 0; n < 12; n++) {
        const mid = _HctSolver.nthVertex(y, n);
        if (mid[0] < 0) {
          continue;
        }
        const midHue = _HctSolver.hueOf(mid);
        if (!initialized) {
          left = mid;
          right = mid;
          leftHue = midHue;
          rightHue = midHue;
          initialized = true;
          continue;
        }
        if (uncut || _HctSolver.areInCyclicOrder(leftHue, midHue, rightHue)) {
          uncut = false;
          if (_HctSolver.areInCyclicOrder(leftHue, targetHue, midHue)) {
            right = mid;
            rightHue = midHue;
          } else {
            left = mid;
            leftHue = midHue;
          }
        }
      }
      return [left, right];
    }
    static midpoint(a, b) {
      return [
        (a[0] + b[0]) / 2,
        (a[1] + b[1]) / 2,
        (a[2] + b[2]) / 2
      ];
    }
    static criticalPlaneBelow(x) {
      return Math.floor(x - 0.5);
    }
    static criticalPlaneAbove(x) {
      return Math.ceil(x - 0.5);
    }
    /**
     * Finds a color with the given Y and hue on the boundary of the
     * cube.
     *
     * @param y The Y value of the color.
     * @param targetHue The hue of the color.
     * @return The desired color, in linear RGB coordinates.
     */
    static bisectToLimit(y, targetHue) {
      const segment = _HctSolver.bisectToSegment(y, targetHue);
      let left = segment[0];
      let leftHue = _HctSolver.hueOf(left);
      let right = segment[1];
      for (let axis = 0; axis < 3; axis++) {
        if (left[axis] !== right[axis]) {
          let lPlane = -1;
          let rPlane = 255;
          if (left[axis] < right[axis]) {
            lPlane = _HctSolver.criticalPlaneBelow(_HctSolver.trueDelinearized(left[axis]));
            rPlane = _HctSolver.criticalPlaneAbove(_HctSolver.trueDelinearized(right[axis]));
          } else {
            lPlane = _HctSolver.criticalPlaneAbove(_HctSolver.trueDelinearized(left[axis]));
            rPlane = _HctSolver.criticalPlaneBelow(_HctSolver.trueDelinearized(right[axis]));
          }
          for (let i = 0; i < 8; i++) {
            if (Math.abs(rPlane - lPlane) <= 1) {
              break;
            } else {
              const mPlane = Math.floor((lPlane + rPlane) / 2);
              const midPlaneCoordinate = _HctSolver.CRITICAL_PLANES[mPlane];
              const mid = _HctSolver.setCoordinate(left, midPlaneCoordinate, right, axis);
              const midHue = _HctSolver.hueOf(mid);
              if (_HctSolver.areInCyclicOrder(leftHue, targetHue, midHue)) {
                right = mid;
                rPlane = mPlane;
              } else {
                left = mid;
                leftHue = midHue;
                lPlane = mPlane;
              }
            }
          }
        }
      }
      return _HctSolver.midpoint(left, right);
    }
    static inverseChromaticAdaptation(adapted) {
      const adaptedAbs = Math.abs(adapted);
      const base = Math.max(0, 27.13 * adaptedAbs / (400 - adaptedAbs));
      return signum(adapted) * Math.pow(base, 1 / 0.42);
    }
    /**
     * Finds a color with the given hue, chroma, and Y.
     *
     * @param hueRadians The desired hue in radians.
     * @param chroma The desired chroma.
     * @param y The desired Y.
     * @return The desired color as a hexadecimal integer, if found; 0
     * otherwise.
     */
    static findResultByJ(hueRadians, chroma, y) {
      let j = Math.sqrt(y) * 11;
      const viewingConditions = ViewingConditions.DEFAULT;
      const tInnerCoeff = 1 / Math.pow(1.64 - Math.pow(0.29, viewingConditions.n), 0.73);
      const eHue = 0.25 * (Math.cos(hueRadians + 2) + 3.8);
      const p1 = eHue * (5e4 / 13) * viewingConditions.nc * viewingConditions.ncb;
      const hSin = Math.sin(hueRadians);
      const hCos = Math.cos(hueRadians);
      for (let iterationRound = 0; iterationRound < 5; iterationRound++) {
        const jNormalized = j / 100;
        const alpha = chroma === 0 || j === 0 ? 0 : chroma / Math.sqrt(jNormalized);
        const t = Math.pow(alpha * tInnerCoeff, 1 / 0.9);
        const ac = viewingConditions.aw * Math.pow(jNormalized, 1 / viewingConditions.c / viewingConditions.z);
        const p2 = ac / viewingConditions.nbb;
        const gamma = 23 * (p2 + 0.305) * t / (23 * p1 + 11 * t * hCos + 108 * t * hSin);
        const a = gamma * hCos;
        const b = gamma * hSin;
        const rA = (460 * p2 + 451 * a + 288 * b) / 1403;
        const gA = (460 * p2 - 891 * a - 261 * b) / 1403;
        const bA = (460 * p2 - 220 * a - 6300 * b) / 1403;
        const rCScaled = _HctSolver.inverseChromaticAdaptation(rA);
        const gCScaled = _HctSolver.inverseChromaticAdaptation(gA);
        const bCScaled = _HctSolver.inverseChromaticAdaptation(bA);
        const linrgb = matrixMultiply([rCScaled, gCScaled, bCScaled], _HctSolver.LINRGB_FROM_SCALED_DISCOUNT);
        if (linrgb[0] < 0 || linrgb[1] < 0 || linrgb[2] < 0) {
          return 0;
        }
        const kR = _HctSolver.Y_FROM_LINRGB[0];
        const kG = _HctSolver.Y_FROM_LINRGB[1];
        const kB = _HctSolver.Y_FROM_LINRGB[2];
        const fnj = kR * linrgb[0] + kG * linrgb[1] + kB * linrgb[2];
        if (fnj <= 0) {
          return 0;
        }
        if (iterationRound === 4 || Math.abs(fnj - y) < 2e-3) {
          if (linrgb[0] > 100.01 || linrgb[1] > 100.01 || linrgb[2] > 100.01) {
            return 0;
          }
          return argbFromLinrgb(linrgb);
        }
        j = j - (fnj - y) * j / (2 * fnj);
      }
      return 0;
    }
    /**
     * Finds an sRGB color with the given hue, chroma, and L*, if
     * possible.
     *
     * @param hueDegrees The desired hue, in degrees.
     * @param chroma The desired chroma.
     * @param lstar The desired L*.
     * @return A hexadecimal representing the sRGB color. The color
     * has sufficiently close hue, chroma, and L* to the desired
     * values, if possible; otherwise, the hue and L* will be
     * sufficiently close, and chroma will be maximized.
     */
    static solveToInt(hueDegrees, chroma, lstar) {
      if (chroma < 1e-4 || lstar < 1e-4 || lstar > 99.9999) {
        return argbFromLstar(lstar);
      }
      hueDegrees = sanitizeDegreesDouble(hueDegrees);
      const hueRadians = hueDegrees / 180 * Math.PI;
      const y = yFromLstar(lstar);
      const exactAnswer = _HctSolver.findResultByJ(hueRadians, chroma, y);
      if (exactAnswer !== 0) {
        return exactAnswer;
      }
      const linrgb = _HctSolver.bisectToLimit(y, hueRadians);
      return argbFromLinrgb(linrgb);
    }
    /**
     * Finds an sRGB color with the given hue, chroma, and L*, if
     * possible.
     *
     * @param hueDegrees The desired hue, in degrees.
     * @param chroma The desired chroma.
     * @param lstar The desired L*.
     * @return An CAM16 object representing the sRGB color. The color
     * has sufficiently close hue, chroma, and L* to the desired
     * values, if possible; otherwise, the hue and L* will be
     * sufficiently close, and chroma will be maximized.
     */
    static solveToCam(hueDegrees, chroma, lstar) {
      return Cam16.fromInt(_HctSolver.solveToInt(hueDegrees, chroma, lstar));
    }
  };
  HctSolver.SCALED_DISCOUNT_FROM_LINRGB = [
    [
      0.001200833568784504,
      0.002389694492170889,
      2795742885861124e-19
    ],
    [
      5891086651375999e-19,
      0.0029785502573438758,
      3270666104008398e-19
    ],
    [
      10146692491640572e-20,
      5364214359186694e-19,
      0.0032979401770712076
    ]
  ];
  HctSolver.LINRGB_FROM_SCALED_DISCOUNT = [
    [
      1373.2198709594231,
      -1100.4251190754821,
      -7.278681089101213
    ],
    [
      -271.815969077903,
      559.6580465940733,
      -32.46047482791194
    ],
    [
      1.9622899599665666,
      -57.173814538844006,
      308.7233197812385
    ]
  ];
  HctSolver.Y_FROM_LINRGB = [0.2126, 0.7152, 0.0722];
  HctSolver.CRITICAL_PLANES = [
    0.015176349177441876,
    0.045529047532325624,
    0.07588174588720938,
    0.10623444424209313,
    0.13658714259697685,
    0.16693984095186062,
    0.19729253930674434,
    0.2276452376616281,
    0.2579979360165119,
    0.28835063437139563,
    0.3188300904430532,
    0.350925934958123,
    0.3848314933096426,
    0.42057480301049466,
    0.458183274052838,
    0.4976837250274023,
    0.5391024159806381,
    0.5824650784040898,
    0.6277969426914107,
    0.6751227633498623,
    0.7244668422128921,
    0.775853049866786,
    0.829304845476233,
    0.8848452951698498,
    0.942497089126609,
    1.0022825574869039,
    1.0642236851973577,
    1.1283421258858297,
    1.1946592148522128,
    1.2631959812511864,
    1.3339731595349034,
    1.407011200216447,
    1.4823302800086415,
    1.5599503113873272,
    1.6398909516233677,
    1.7221716113234105,
    1.8068114625156377,
    1.8938294463134073,
    1.9832442801866852,
    2.075074464868551,
    2.1693382909216234,
    2.2660538449872063,
    2.36523901573795,
    2.4669114995532007,
    2.5710888059345764,
    2.6777882626779785,
    2.7870270208169257,
    2.898822059350997,
    3.0131901897720907,
    3.1301480604002863,
    3.2497121605402226,
    3.3718988244681087,
    3.4967242352587946,
    3.624204428461639,
    3.754355295633311,
    3.887192587735158,
    4.022731918402185,
    4.160988767090289,
    4.301978482107941,
    4.445716283538092,
    4.592217266055746,
    4.741496401646282,
    4.893568542229298,
    5.048448422192488,
    5.20615066083972,
    5.3666897647573375,
    5.5300801301023865,
    5.696336044816294,
    5.865471690767354,
    6.037501145825082,
    6.212438385869475,
    6.390297286737924,
    6.571091626112461,
    6.7548350853498045,
    6.941541251256611,
    7.131223617812143,
    7.323895587840543,
    7.5195704746346665,
    7.7182615035334345,
    7.919981813454504,
    8.124744458384042,
    8.332562408825165,
    8.543448553206703,
    8.757415699253682,
    8.974476575321063,
    9.194643831691977,
    9.417930041841839,
    9.644347703669503,
    9.873909240696694,
    10.106627003236781,
    10.342513269534024,
    10.58158024687427,
    10.8238400726681,
    11.069304815507364,
    11.317986476196008,
    11.569896988756009,
    11.825048221409341,
    12.083451977536606,
    12.345119996613247,
    12.610063955123938,
    12.878295467455942,
    13.149826086772048,
    13.42466730586372,
    13.702830557985108,
    13.984327217668513,
    14.269168601521828,
    14.55736596900856,
    14.848930523210871,
    15.143873411576273,
    15.44220572664832,
    15.743938506781891,
    16.04908273684337,
    16.35764934889634,
    16.66964922287304,
    16.985093187232053,
    17.30399201960269,
    17.62635644741625,
    17.95219714852476,
    18.281524751807332,
    18.614349837764564,
    18.95068293910138,
    19.290534541298456,
    19.633915083172692,
    19.98083495742689,
    20.331304511189067,
    20.685334046541502,
    21.042933821039977,
    21.404114048223256,
    21.76888489811322,
    22.137256497705877,
    22.50923893145328,
    22.884842241736916,
    23.264076429332462,
    23.6469514538663,
    24.033477234264016,
    24.42366364919083,
    24.817520537484558,
    25.21505769858089,
    25.61628489293138,
    26.021211842414342,
    26.429848230738664,
    26.842203703840827,
    27.258287870275353,
    27.678110301598522,
    28.10168053274597,
    28.529008062403893,
    28.96010235337422,
    29.39497283293396,
    29.83362889318845,
    30.276079891419332,
    30.722335150426627,
    31.172403958865512,
    31.62629557157785,
    32.08401920991837,
    32.54558406207592,
    33.010999283389665,
    33.4802739966603,
    33.953417292456834,
    34.430438229418264,
    34.911345834551085,
    35.39614910352207,
    35.88485700094671,
    36.37747846067349,
    36.87402238606382,
    37.37449765026789,
    37.87891309649659,
    38.38727753828926,
    38.89959975977785,
    39.41588851594697,
    39.93615253289054,
    40.460400508064545,
    40.98864111053629,
    41.520882981230194,
    42.05713473317016,
    42.597404951718396,
    43.141702194811224,
    43.6900349931913,
    44.24241185063697,
    44.798841244188324,
    45.35933162437017,
    45.92389141541209,
    46.49252901546552,
    47.065252796817916,
    47.64207110610409,
    48.22299226451468,
    48.808024568002054,
    49.3971762874833,
    49.9904556690408,
    50.587870934119984,
    51.189430279724725,
    51.79514187861014,
    52.40501387947288,
    53.0190544071392,
    53.637271562750364,
    54.259673423945976,
    54.88626804504493,
    55.517063457223934,
    56.15206766869424,
    56.79128866487574,
    57.43473440856916,
    58.08241284012621,
    58.734331877617365,
    59.39049941699807,
    60.05092333227251,
    60.715611475655585,
    61.38457167773311,
    62.057811747619894,
    62.7353394731159,
    63.417162620860914,
    64.10328893648692,
    64.79372614476921,
    65.48848194977529,
    66.18756403501224,
    66.89098006357258,
    67.59873767827808,
    68.31084450182222,
    69.02730813691093,
    69.74813616640164,
    70.47333615344107,
    71.20291564160104,
    71.93688215501312,
    72.67524319850172,
    73.41800625771542,
    74.16517879925733,
    74.9167682708136,
    75.67278210128072,
    76.43322770089146,
    77.1981124613393,
    77.96744375590167,
    78.74122893956174,
    79.51947534912904,
    80.30219030335869,
    81.08938110306934,
    81.88105503125999,
    82.67721935322541,
    83.4778813166706,
    84.28304815182372,
    85.09272707154808,
    85.90692527145302,
    86.72564993000343,
    87.54890820862819,
    88.3767072518277,
    89.2090541872801,
    90.04595612594655,
    90.88742016217518,
    91.73345337380438,
    92.58406282226491,
    93.43925555268066,
    94.29903859396902,
    95.16341895893969,
    96.03240364439274,
    96.9059996312159,
    97.78421388448044,
    98.6670533535366,
    99.55452497210776
  ];

  // hct/hct.js
  var Hct = class _Hct {
    static from(hue, chroma, tone) {
      return new _Hct(HctSolver.solveToInt(hue, chroma, tone));
    }
    /**
     * @param argb ARGB representation of a color.
     * @return HCT representation of a color in default viewing conditions
     */
    static fromInt(argb) {
      return new _Hct(argb);
    }
    toInt() {
      return this.argb;
    }
    /**
     * A number, in degrees, representing ex. red, orange, yellow, etc.
     * Ranges from 0 <= hue < 360.
     */
    get hue() {
      return this.internalHue;
    }
    /**
     * @param newHue 0 <= newHue < 360; invalid values are corrected.
     * Chroma may decrease because chroma has a different maximum for any given
     * hue and tone.
     */
    set hue(newHue) {
      this.setInternalState(HctSolver.solveToInt(newHue, this.internalChroma, this.internalTone));
    }
    get chroma() {
      return this.internalChroma;
    }
    /**
     * @param newChroma 0 <= newChroma < ?
     * Chroma may decrease because chroma has a different maximum for any given
     * hue and tone.
     */
    set chroma(newChroma) {
      this.setInternalState(HctSolver.solveToInt(this.internalHue, newChroma, this.internalTone));
    }
    /** Lightness. Ranges from 0 to 100. */
    get tone() {
      return this.internalTone;
    }
    /**
     * @param newTone 0 <= newTone <= 100; invalid valids are corrected.
     * Chroma may decrease because chroma has a different maximum for any given
     * hue and tone.
     */
    set tone(newTone) {
      this.setInternalState(HctSolver.solveToInt(this.internalHue, this.internalChroma, newTone));
    }
    /** Sets a property of the Hct object. */
    setValue(propertyName, value) {
      this[propertyName] = value;
    }
    toString() {
      return `HCT(${this.hue.toFixed(0)}, ${this.chroma.toFixed(0)}, ${this.tone.toFixed(0)})`;
    }
    isBlue() {
      return this.hue >= 250 && this.hue < 270;
    }
    isYellow() {
      return this.hue >= 105 && this.hue < 125;
    }
    isCyan() {
      return this.hue >= 170 && this.hue < 207;
    }
    constructor(argb) {
      this.argb = argb;
      const cam = Cam16.fromInt(argb);
      this.internalHue = cam.hue;
      this.internalChroma = cam.chroma;
      this.internalTone = lstarFromArgb(argb);
      this.argb = argb;
    }
    setInternalState(argb) {
      const cam = Cam16.fromInt(argb);
      this.internalHue = cam.hue;
      this.internalChroma = cam.chroma;
      this.internalTone = lstarFromArgb(argb);
      this.argb = argb;
    }
    /**
     * Translates a color into different [ViewingConditions].
     *
     * Colors change appearance. They look different with lights on versus off,
     * the same color, as in hex code, on white looks different when on black.
     * This is called color relativity, most famously explicated by Josef Albers
     * in Interaction of Color.
     *
     * In color science, color appearance models can account for this and
     * calculate the appearance of a color in different settings. HCT is based on
     * CAM16, a color appearance model, and uses it to make these calculations.
     *
     * See [ViewingConditions.make] for parameters affecting color appearance.
     */
    inViewingConditions(vc) {
      const cam = Cam16.fromInt(this.toInt());
      const viewedInVc = cam.xyzInViewingConditions(vc);
      const recastInVc = Cam16.fromXyzInViewingConditions(viewedInVc[0], viewedInVc[1], viewedInVc[2], ViewingConditions.make());
      const recastHct = _Hct.from(recastInVc.hue, recastInVc.chroma, lstarFromY(viewedInVc[1]));
      return recastHct;
    }
  };

  // blend/blend.js
  var Blend = class _Blend {
    /**
     * Blend the design color's HCT hue towards the key color's HCT
     * hue, in a way that leaves the original color recognizable and
     * recognizably shifted towards the key color.
     *
     * @param designColor ARGB representation of an arbitrary color.
     * @param sourceColor ARGB representation of the main theme color.
     * @return The design color with a hue shifted towards the
     * system's color, a slightly warmer/cooler variant of the design
     * color's hue.
     */
    static harmonize(designColor, sourceColor) {
      const fromHct = Hct.fromInt(designColor);
      const toHct = Hct.fromInt(sourceColor);
      const differenceDegrees2 = differenceDegrees(fromHct.hue, toHct.hue);
      const rotationDegrees = Math.min(differenceDegrees2 * 0.5, 15);
      const outputHue = sanitizeDegreesDouble(fromHct.hue + rotationDegrees * rotationDirection(fromHct.hue, toHct.hue));
      return Hct.from(outputHue, fromHct.chroma, fromHct.tone).toInt();
    }
    /**
     * Blends hue from one color into another. The chroma and tone of
     * the original color are maintained.
     *
     * @param from ARGB representation of color
     * @param to ARGB representation of color
     * @param amount how much blending to perform; 0.0 >= and <= 1.0
     * @return from, with a hue blended towards to. Chroma and tone
     * are constant.
     */
    static hctHue(from, to, amount) {
      const ucs = _Blend.cam16Ucs(from, to, amount);
      const ucsCam = Cam16.fromInt(ucs);
      const fromCam = Cam16.fromInt(from);
      const blended = Hct.from(ucsCam.hue, fromCam.chroma, lstarFromArgb(from));
      return blended.toInt();
    }
    /**
     * Blend in CAM16-UCS space.
     *
     * @param from ARGB representation of color
     * @param to ARGB representation of color
     * @param amount how much blending to perform; 0.0 >= and <= 1.0
     * @return from, blended towards to. Hue, chroma, and tone will
     * change.
     */
    static cam16Ucs(from, to, amount) {
      const fromCam = Cam16.fromInt(from);
      const toCam = Cam16.fromInt(to);
      const fromJ = fromCam.jstar;
      const fromA = fromCam.astar;
      const fromB = fromCam.bstar;
      const toJ = toCam.jstar;
      const toA = toCam.astar;
      const toB = toCam.bstar;
      const jstar = fromJ + (toJ - fromJ) * amount;
      const astar = fromA + (toA - fromA) * amount;
      const bstar = fromB + (toB - fromB) * amount;
      return Cam16.fromUcs(jstar, astar, bstar).toInt();
    }
  };

  // contrast/contrast.js
  var Contrast = class _Contrast {
    /**
     * Returns a contrast ratio, which ranges from 1 to 21.
     *
     * @param toneA Tone between 0 and 100. Values outside will be clamped.
     * @param toneB Tone between 0 and 100. Values outside will be clamped.
     */
    static ratioOfTones(toneA, toneB) {
      toneA = clampDouble(0, 100, toneA);
      toneB = clampDouble(0, 100, toneB);
      return _Contrast.ratioOfYs(yFromLstar(toneA), yFromLstar(toneB));
    }
    static ratioOfYs(y1, y2) {
      const lighter = y1 > y2 ? y1 : y2;
      const darker = lighter === y2 ? y1 : y2;
      return (lighter + 5) / (darker + 5);
    }
    /**
     * Returns a tone >= tone parameter that ensures ratio parameter.
     * Return value is between 0 and 100.
     * Returns -1 if ratio cannot be achieved with tone parameter.
     *
     * @param tone Tone return value must contrast with.
     * Range is 0 to 100. Invalid values will result in -1 being returned.
     * @param ratio Contrast ratio of return value and tone.
     * Range is 1 to 21, invalid values have undefined behavior.
     */
    static lighter(tone, ratio) {
      if (tone < 0 || tone > 100) {
        return -1;
      }
      const darkY = yFromLstar(tone);
      const lightY = ratio * (darkY + 5) - 5;
      const realContrast = _Contrast.ratioOfYs(lightY, darkY);
      const delta = Math.abs(realContrast - ratio);
      if (realContrast < ratio && delta > 0.04) {
        return -1;
      }
      const returnValue = lstarFromY(lightY) + 0.4;
      if (returnValue < 0 || returnValue > 100) {
        return -1;
      }
      return returnValue;
    }
    /**
     * Returns a tone <= tone parameter that ensures ratio parameter.
     * Return value is between 0 and 100.
     * Returns -1 if ratio cannot be achieved with tone parameter.
     *
     * @param tone Tone return value must contrast with.
     * Range is 0 to 100. Invalid values will result in -1 being returned.
     * @param ratio Contrast ratio of return value and tone.
     * Range is 1 to 21, invalid values have undefined behavior.
     */
    static darker(tone, ratio) {
      if (tone < 0 || tone > 100) {
        return -1;
      }
      const lightY = yFromLstar(tone);
      const darkY = (lightY + 5) / ratio - 5;
      const realContrast = _Contrast.ratioOfYs(lightY, darkY);
      const delta = Math.abs(realContrast - ratio);
      if (realContrast < ratio && delta > 0.04) {
        return -1;
      }
      const returnValue = lstarFromY(darkY) - 0.4;
      if (returnValue < 0 || returnValue > 100) {
        return -1;
      }
      return returnValue;
    }
    /**
     * Returns a tone >= tone parameter that ensures ratio parameter.
     * Return value is between 0 and 100.
     * Returns 100 if ratio cannot be achieved with tone parameter.
     *
     * This method is unsafe because the returned value is guaranteed to be in
     * bounds for tone, i.e. between 0 and 100. However, that value may not reach
     * the ratio with tone. For example, there is no color lighter than T100.
     *
     * @param tone Tone return value must contrast with.
     * Range is 0 to 100. Invalid values will result in 100 being returned.
     * @param ratio Desired contrast ratio of return value and tone parameter.
     * Range is 1 to 21, invalid values have undefined behavior.
     */
    static lighterUnsafe(tone, ratio) {
      const lighterSafe = _Contrast.lighter(tone, ratio);
      return lighterSafe < 0 ? 100 : lighterSafe;
    }
    /**
     * Returns a tone >= tone parameter that ensures ratio parameter.
     * Return value is between 0 and 100.
     * Returns 100 if ratio cannot be achieved with tone parameter.
     *
     * This method is unsafe because the returned value is guaranteed to be in
     * bounds for tone, i.e. between 0 and 100. However, that value may not reach
     * the [ratio with [tone]. For example, there is no color darker than T0.
     *
     * @param tone Tone return value must contrast with.
     * Range is 0 to 100. Invalid values will result in 0 being returned.
     * @param ratio Desired contrast ratio of return value and tone parameter.
     * Range is 1 to 21, invalid values have undefined behavior.
     */
    static darkerUnsafe(tone, ratio) {
      const darkerSafe = _Contrast.darker(tone, ratio);
      return darkerSafe < 0 ? 0 : darkerSafe;
    }
  };

  // dislike/dislike_analyzer.js
  var DislikeAnalyzer = class _DislikeAnalyzer {
    /**
     * Returns true if a color is disliked.
     *
     * @param hct A color to be judged.
     * @return Whether the color is disliked.
     *
     * Disliked is defined as a dark yellow-green that is not neutral.
     */
    static isDisliked(hct) {
      const huePasses = Math.round(hct.hue) >= 90 && Math.round(hct.hue) <= 111;
      const chromaPasses = Math.round(hct.chroma) > 16;
      const tonePasses = Math.round(hct.tone) < 65;
      return huePasses && chromaPasses && tonePasses;
    }
    /**
     * If a color is disliked, lighten it to make it likable.
     *
     * @param hct A color to be judged.
     * @return A new color if the original color is disliked, or the original
     *   color if it is acceptable.
     */
    static fixIfDisliked(hct) {
      if (_DislikeAnalyzer.isDisliked(hct)) {
        return Hct.from(hct.hue, hct.chroma, 70);
      }
      return hct;
    }
  };

  // dynamiccolor/dynamic_color.js
  function validateExtendedColor(originalColor, specVersion, extendedColor) {
    if (originalColor.name !== extendedColor.name) {
      throw new Error(`Attempting to extend color ${originalColor.name} with color ${extendedColor.name} of different name for spec version ${specVersion}.`);
    }
    if (originalColor.isBackground !== extendedColor.isBackground) {
      throw new Error(`Attempting to extend color ${originalColor.name} as a ${originalColor.isBackground ? "background" : "foreground"} with color ${extendedColor.name} as a ${extendedColor.isBackground ? "background" : "foreground"} for spec version ${specVersion}.`);
    }
  }
  function extendSpecVersion(originlColor, specVersion, extendedColor) {
    validateExtendedColor(originlColor, specVersion, extendedColor);
    return DynamicColor.fromPalette({
      name: originlColor.name,
      palette: (s) => s.specVersion === specVersion ? extendedColor.palette(s) : originlColor.palette(s),
      tone: (s) => s.specVersion === specVersion ? extendedColor.tone(s) : originlColor.tone(s),
      isBackground: originlColor.isBackground,
      chromaMultiplier: (s) => {
        const chromaMultiplier = s.specVersion === specVersion ? extendedColor.chromaMultiplier : originlColor.chromaMultiplier;
        return chromaMultiplier !== void 0 ? chromaMultiplier(s) : 1;
      },
      background: (s) => {
        const background = s.specVersion === specVersion ? extendedColor.background : originlColor.background;
        return background !== void 0 ? background(s) : void 0;
      },
      secondBackground: (s) => {
        const secondBackground = s.specVersion === specVersion ? extendedColor.secondBackground : originlColor.secondBackground;
        return secondBackground !== void 0 ? secondBackground(s) : void 0;
      },
      contrastCurve: (s) => {
        const contrastCurve = s.specVersion === specVersion ? extendedColor.contrastCurve : originlColor.contrastCurve;
        return contrastCurve !== void 0 ? contrastCurve(s) : void 0;
      },
      toneDeltaPair: (s) => {
        const toneDeltaPair = s.specVersion === specVersion ? extendedColor.toneDeltaPair : originlColor.toneDeltaPair;
        return toneDeltaPair !== void 0 ? toneDeltaPair(s) : void 0;
      }
    });
  }
  var DynamicColor = class _DynamicColor {
    /**
     * Create a DynamicColor defined by a TonalPalette and HCT tone.
     *
     * @param args Functions with DynamicScheme as input. Must provide a palette
     *     and tone. May provide a background DynamicColor and ToneDeltaPair.
     */
    static fromPalette(args) {
      return new _DynamicColor(args.name ?? "", args.palette, args.tone ?? _DynamicColor.getInitialToneFromBackground(args.background), args.isBackground ?? false, args.chromaMultiplier, args.background, args.secondBackground, args.contrastCurve, args.toneDeltaPair);
    }
    static getInitialToneFromBackground(background) {
      if (background === void 0) {
        return (s) => 50;
      }
      return (s) => background(s) ? background(s).getTone(s) : 50;
    }
    /**
     * The base constructor for DynamicColor.
     *
     * _Strongly_ prefer using one of the convenience constructors. This class is
     * arguably too flexible to ensure it can support any scenario. Functional
     * arguments allow  overriding without risks that come with subclasses.
     *
     * For example, the default behavior of adjust tone at max contrast
     * to be at a 7.0 ratio with its background is principled and
     * matches accessibility guidance. That does not mean it's the desired
     * approach for _every_ design system, and every color pairing,
     * always, in every case.
     *
     * @param name The name of the dynamic color. Defaults to empty.
     * @param palette Function that provides a TonalPalette given DynamicScheme. A
     *     TonalPalette is defined by a hue and chroma, so this replaces the need
     *     to specify hue/chroma. By providing a tonal palette, when contrast
     *     adjustments are made, intended chroma can be preserved.
     * @param tone Function that provides a tone, given a DynamicScheme.
     * @param isBackground Whether this dynamic color is a background, with some
     *     other color as the foreground. Defaults to false.
     * @param chromaMultiplier A factor that multiplies the chroma for this color.
     * @param background The background of the dynamic color (as a function of a
     *     `DynamicScheme`), if it exists.
     * @param secondBackground A second background of the dynamic color (as a
     *     function of a `DynamicScheme`), if it exists.
     * @param contrastCurve A `ContrastCurve` object specifying how its contrast
     *     against its background should behave in various contrast levels
     *     options.
     * @param toneDeltaPair A `ToneDeltaPair` object specifying a tone delta
     *     constraint between two colors. One of them must be the color being
     *     constructed.
     */
    constructor(name, palette, tone, isBackground, chromaMultiplier, background, secondBackground, contrastCurve, toneDeltaPair) {
      this.name = name;
      this.palette = palette;
      this.tone = tone;
      this.isBackground = isBackground;
      this.chromaMultiplier = chromaMultiplier;
      this.background = background;
      this.secondBackground = secondBackground;
      this.contrastCurve = contrastCurve;
      this.toneDeltaPair = toneDeltaPair;
      this.hctCache = /* @__PURE__ */ new Map();
      if (!background && secondBackground) {
        throw new Error(`Color ${name} has secondBackgrounddefined, but background is not defined.`);
      }
      if (!background && contrastCurve) {
        throw new Error(`Color ${name} has contrastCurvedefined, but background is not defined.`);
      }
      if (background && !contrastCurve) {
        throw new Error(`Color ${name} has backgrounddefined, but contrastCurve is not defined.`);
      }
    }
    /**
     * Returns a deep copy of this DynamicColor.
     */
    clone() {
      return _DynamicColor.fromPalette({
        name: this.name,
        palette: this.palette,
        tone: this.tone,
        isBackground: this.isBackground,
        chromaMultiplier: this.chromaMultiplier,
        background: this.background,
        secondBackground: this.secondBackground,
        contrastCurve: this.contrastCurve,
        toneDeltaPair: this.toneDeltaPair
      });
    }
    /**
     * Clears the cache of HCT values for this color. For testing or debugging
     * purposes.
     */
    clearCache() {
      this.hctCache.clear();
    }
    /**
     * Returns a ARGB integer (i.e. a hex code).
     *
     * @param scheme Defines the conditions of the user interface, for example,
     *     whether or not it is dark mode or light mode, and what the desired
     *     contrast level is.
     */
    getArgb(scheme) {
      return this.getHct(scheme).toInt();
    }
    /**
     * Returns a color, expressed in the HCT color space, that this
     * DynamicColor is under the conditions in scheme.
     *
     * @param scheme Defines the conditions of the user interface, for example,
     *     whether or not it is dark mode or light mode, and what the desired
     *     contrast level is.
     */
    getHct(scheme) {
      const cachedAnswer = this.hctCache.get(scheme);
      if (cachedAnswer != null) {
        return cachedAnswer;
      }
      const answer = getSpec(scheme.specVersion).getHct(scheme, this);
      if (this.hctCache.size > 4) {
        this.hctCache.clear();
      }
      this.hctCache.set(scheme, answer);
      return answer;
    }
    /**
     * Returns a tone, T in the HCT color space, that this DynamicColor is under
     * the conditions in scheme.
     *
     * @param scheme Defines the conditions of the user interface, for example,
     *     whether or not it is dark mode or light mode, and what the desired
     *     contrast level is.
     */
    getTone(scheme) {
      return getSpec(scheme.specVersion).getTone(scheme, this);
    }
    /**
     * Given a background tone, finds a foreground tone, while ensuring they reach
     * a contrast ratio that is as close to [ratio] as possible.
     *
     * @param bgTone Tone in HCT. Range is 0 to 100, undefined behavior when it
     *     falls outside that range.
     * @param ratio The contrast ratio desired between bgTone and the return
     *     value.
     */
    static foregroundTone(bgTone, ratio) {
      const lighterTone = Contrast.lighterUnsafe(bgTone, ratio);
      const darkerTone = Contrast.darkerUnsafe(bgTone, ratio);
      const lighterRatio = Contrast.ratioOfTones(lighterTone, bgTone);
      const darkerRatio = Contrast.ratioOfTones(darkerTone, bgTone);
      const preferLighter = _DynamicColor.tonePrefersLightForeground(bgTone);
      if (preferLighter) {
        const negligibleDifference = Math.abs(lighterRatio - darkerRatio) < 0.1 && lighterRatio < ratio && darkerRatio < ratio;
        return lighterRatio >= ratio || lighterRatio >= darkerRatio || negligibleDifference ? lighterTone : darkerTone;
      } else {
        return darkerRatio >= ratio || darkerRatio >= lighterRatio ? darkerTone : lighterTone;
      }
    }
    /**
     * Returns whether [tone] prefers a light foreground.
     *
     * People prefer white foregrounds on ~T60-70. Observed over time, and also
     * by Andrew Somers during research for APCA.
     *
     * T60 used as to create the smallest discontinuity possible when skipping
     * down to T49 in order to ensure light foregrounds.
     * Since `tertiaryContainer` in dark monochrome scheme requires a tone of
     * 60, it should not be adjusted. Therefore, 60 is excluded here.
     */
    static tonePrefersLightForeground(tone) {
      return Math.round(tone) < 60;
    }
    /**
     * Returns whether [tone] can reach a contrast ratio of 4.5 with a lighter
     * color.
     */
    static toneAllowsLightForeground(tone) {
      return Math.round(tone) <= 49;
    }
    /**
     * Adjusts a tone such that white has 4.5 contrast, if the tone is
     * reasonably close to supporting it.
     */
    static enableLightForeground(tone) {
      if (_DynamicColor.tonePrefersLightForeground(tone) && !_DynamicColor.toneAllowsLightForeground(tone)) {
        return 49;
      }
      return tone;
    }
  };
  var ColorCalculationDelegateImpl2021 = class {
    getHct(scheme, color) {
      const tone = color.getTone(scheme);
      const palette = color.palette(scheme);
      return palette.getHct(tone);
    }
    getTone(scheme, color) {
      const decreasingContrast = scheme.contrastLevel < 0;
      const toneDeltaPair = color.toneDeltaPair ? color.toneDeltaPair(scheme) : void 0;
      if (toneDeltaPair) {
        const roleA = toneDeltaPair.roleA;
        const roleB = toneDeltaPair.roleB;
        const delta = toneDeltaPair.delta;
        const polarity = toneDeltaPair.polarity;
        const stayTogether = toneDeltaPair.stayTogether;
        const aIsNearer = polarity === "nearer" || polarity === "lighter" && !scheme.isDark || polarity === "darker" && scheme.isDark;
        const nearer = aIsNearer ? roleA : roleB;
        const farther = aIsNearer ? roleB : roleA;
        const amNearer = color.name === nearer.name;
        const expansionDir = scheme.isDark ? 1 : -1;
        let nTone = nearer.tone(scheme);
        let fTone = farther.tone(scheme);
        if (color.background && nearer.contrastCurve && farther.contrastCurve) {
          const bg = color.background(scheme);
          const nContrastCurve = nearer.contrastCurve(scheme);
          const fContrastCurve = farther.contrastCurve(scheme);
          if (bg && nContrastCurve && fContrastCurve) {
            const bgTone = bg.getTone(scheme);
            const nContrast = nContrastCurve.get(scheme.contrastLevel);
            const fContrast = fContrastCurve.get(scheme.contrastLevel);
            if (Contrast.ratioOfTones(bgTone, nTone) < nContrast) {
              nTone = DynamicColor.foregroundTone(bgTone, nContrast);
            }
            if (Contrast.ratioOfTones(bgTone, fTone) < fContrast) {
              fTone = DynamicColor.foregroundTone(bgTone, fContrast);
            }
            if (decreasingContrast) {
              nTone = DynamicColor.foregroundTone(bgTone, nContrast);
              fTone = DynamicColor.foregroundTone(bgTone, fContrast);
            }
          }
        }
        if ((fTone - nTone) * expansionDir < delta) {
          fTone = clampDouble(0, 100, nTone + delta * expansionDir);
          if ((fTone - nTone) * expansionDir >= delta) {
          } else {
            nTone = clampDouble(0, 100, fTone - delta * expansionDir);
          }
        }
        if (50 <= nTone && nTone < 60) {
          if (expansionDir > 0) {
            nTone = 60;
            fTone = Math.max(fTone, nTone + delta * expansionDir);
          } else {
            nTone = 49;
            fTone = Math.min(fTone, nTone + delta * expansionDir);
          }
        } else if (50 <= fTone && fTone < 60) {
          if (stayTogether) {
            if (expansionDir > 0) {
              nTone = 60;
              fTone = Math.max(fTone, nTone + delta * expansionDir);
            } else {
              nTone = 49;
              fTone = Math.min(fTone, nTone + delta * expansionDir);
            }
          } else {
            if (expansionDir > 0) {
              fTone = 60;
            } else {
              fTone = 49;
            }
          }
        }
        return amNearer ? nTone : fTone;
      } else {
        let answer = color.tone(scheme);
        if (color.background == void 0 || color.background(scheme) === void 0 || color.contrastCurve == void 0 || color.contrastCurve(scheme) === void 0) {
          return answer;
        }
        const bgTone = color.background(scheme).getTone(scheme);
        const desiredRatio = color.contrastCurve(scheme).get(scheme.contrastLevel);
        if (Contrast.ratioOfTones(bgTone, answer) >= desiredRatio) {
        } else {
          answer = DynamicColor.foregroundTone(bgTone, desiredRatio);
        }
        if (decreasingContrast) {
          answer = DynamicColor.foregroundTone(bgTone, desiredRatio);
        }
        if (color.isBackground && 50 <= answer && answer < 60) {
          if (Contrast.ratioOfTones(49, bgTone) >= desiredRatio) {
            answer = 49;
          } else {
            answer = 60;
          }
        }
        if (color.secondBackground == void 0 || color.secondBackground(scheme) === void 0) {
          return answer;
        }
        const [bg1, bg2] = [color.background, color.secondBackground];
        const [bgTone1, bgTone2] = [bg1(scheme).getTone(scheme), bg2(scheme).getTone(scheme)];
        const [upper, lower] = [Math.max(bgTone1, bgTone2), Math.min(bgTone1, bgTone2)];
        if (Contrast.ratioOfTones(upper, answer) >= desiredRatio && Contrast.ratioOfTones(lower, answer) >= desiredRatio) {
          return answer;
        }
        const lightOption = Contrast.lighter(upper, desiredRatio);
        const darkOption = Contrast.darker(lower, desiredRatio);
        const availables = [];
        if (lightOption !== -1)
          availables.push(lightOption);
        if (darkOption !== -1)
          availables.push(darkOption);
        const prefersLight = DynamicColor.tonePrefersLightForeground(bgTone1) || DynamicColor.tonePrefersLightForeground(bgTone2);
        if (prefersLight) {
          return lightOption < 0 ? 100 : lightOption;
        }
        if (availables.length === 1) {
          return availables[0];
        }
        return darkOption < 0 ? 0 : darkOption;
      }
    }
  };
  var ColorCalculationDelegateImpl2025 = class {
    getHct(scheme, color) {
      const palette = color.palette(scheme);
      const tone = color.getTone(scheme);
      const hue = palette.hue;
      const chroma = palette.chroma * (color.chromaMultiplier ? color.chromaMultiplier(scheme) : 1);
      return Hct.from(hue, chroma, tone);
    }
    getTone(scheme, color) {
      const toneDeltaPair = color.toneDeltaPair ? color.toneDeltaPair(scheme) : void 0;
      if (toneDeltaPair) {
        const roleA = toneDeltaPair.roleA;
        const roleB = toneDeltaPair.roleB;
        const polarity = toneDeltaPair.polarity;
        const constraint = toneDeltaPair.constraint;
        const absoluteDelta = polarity === "darker" || polarity === "relative_lighter" && scheme.isDark || polarity === "relative_darker" && !scheme.isDark ? -toneDeltaPair.delta : toneDeltaPair.delta;
        const amRoleA = color.name === roleA.name;
        const selfRole = amRoleA ? roleA : roleB;
        const refRole = amRoleA ? roleB : roleA;
        let selfTone = selfRole.tone(scheme);
        let refTone = refRole.getTone(scheme);
        const relativeDelta = absoluteDelta * (amRoleA ? 1 : -1);
        if (constraint === "exact") {
          selfTone = clampDouble(0, 100, refTone + relativeDelta);
        } else if (constraint === "nearer") {
          if (relativeDelta > 0) {
            selfTone = clampDouble(0, 100, clampDouble(refTone, refTone + relativeDelta, selfTone));
          } else {
            selfTone = clampDouble(0, 100, clampDouble(refTone + relativeDelta, refTone, selfTone));
          }
        } else if (constraint === "farther") {
          if (relativeDelta > 0) {
            selfTone = clampDouble(refTone + relativeDelta, 100, selfTone);
          } else {
            selfTone = clampDouble(0, refTone + relativeDelta, selfTone);
          }
        }
        if (color.background && color.contrastCurve) {
          const background = color.background(scheme);
          const contrastCurve = color.contrastCurve(scheme);
          if (background && contrastCurve) {
            const bgTone = background.getTone(scheme);
            const selfContrast = contrastCurve.get(scheme.contrastLevel);
            selfTone = Contrast.ratioOfTones(bgTone, selfTone) >= selfContrast && scheme.contrastLevel >= 0 ? selfTone : DynamicColor.foregroundTone(bgTone, selfContrast);
          }
        }
        if (color.isBackground && !color.name.endsWith("_fixed_dim")) {
          if (selfTone >= 57) {
            selfTone = clampDouble(65, 100, selfTone);
          } else {
            selfTone = clampDouble(0, 49, selfTone);
          }
        }
        return selfTone;
      } else {
        let answer = color.tone(scheme);
        if (color.background == void 0 || color.background(scheme) === void 0 || color.contrastCurve == void 0 || color.contrastCurve(scheme) === void 0) {
          return answer;
        }
        const bgTone = color.background(scheme).getTone(scheme);
        const desiredRatio = color.contrastCurve(scheme).get(scheme.contrastLevel);
        answer = Contrast.ratioOfTones(bgTone, answer) >= desiredRatio && scheme.contrastLevel >= 0 ? answer : DynamicColor.foregroundTone(bgTone, desiredRatio);
        if (color.isBackground && !color.name.endsWith("_fixed_dim")) {
          if (answer >= 57) {
            answer = clampDouble(65, 100, answer);
          } else {
            answer = clampDouble(0, 49, answer);
          }
        }
        if (color.secondBackground == void 0 || color.secondBackground(scheme) === void 0) {
          return answer;
        }
        const [bg1, bg2] = [color.background, color.secondBackground];
        const [bgTone1, bgTone2] = [bg1(scheme).getTone(scheme), bg2(scheme).getTone(scheme)];
        const [upper, lower] = [Math.max(bgTone1, bgTone2), Math.min(bgTone1, bgTone2)];
        if (Contrast.ratioOfTones(upper, answer) >= desiredRatio && Contrast.ratioOfTones(lower, answer) >= desiredRatio) {
          return answer;
        }
        const lightOption = Contrast.lighter(upper, desiredRatio);
        const darkOption = Contrast.darker(lower, desiredRatio);
        const availables = [];
        if (lightOption !== -1)
          availables.push(lightOption);
        if (darkOption !== -1)
          availables.push(darkOption);
        const prefersLight = DynamicColor.tonePrefersLightForeground(bgTone1) || DynamicColor.tonePrefersLightForeground(bgTone2);
        if (prefersLight) {
          return lightOption < 0 ? 100 : lightOption;
        }
        if (availables.length === 1) {
          return availables[0];
        }
        return darkOption < 0 ? 0 : darkOption;
      }
    }
  };
  var spec2021 = new ColorCalculationDelegateImpl2021();
  var spec2025 = new ColorCalculationDelegateImpl2025();
  function getSpec(specVersion) {
    return specVersion === "2025" ? spec2025 : spec2021;
  }

  // palettes/tonal_palette.js
  var TonalPalette = class _TonalPalette {
    /**
     * @param argb ARGB representation of a color
     * @return Tones matching that color's hue and chroma.
     */
    static fromInt(argb) {
      const hct = Hct.fromInt(argb);
      return _TonalPalette.fromHct(hct);
    }
    /**
     * @param hct Hct
     * @return Tones matching that color's hue and chroma.
     */
    static fromHct(hct) {
      return new _TonalPalette(hct.hue, hct.chroma, hct);
    }
    /**
     * @param hue HCT hue
     * @param chroma HCT chroma
     * @return Tones matching hue and chroma.
     */
    static fromHueAndChroma(hue, chroma) {
      const keyColor = new KeyColor(hue, chroma).create();
      return new _TonalPalette(hue, chroma, keyColor);
    }
    constructor(hue, chroma, keyColor) {
      this.hue = hue;
      this.chroma = chroma;
      this.keyColor = keyColor;
      this.cache = /* @__PURE__ */ new Map();
    }
    /**
     * @param tone HCT tone, measured from 0 to 100.
     * @return ARGB representation of a color with that tone.
     */
    tone(tone) {
      let argb = this.cache.get(tone);
      if (argb === void 0) {
        argb = Hct.from(this.hue, this.chroma, tone).toInt();
        this.cache.set(tone, argb);
      }
      return argb;
    }
    /**
     * @param tone HCT tone.
     * @return HCT representation of a color with that tone.
     */
    getHct(tone) {
      return Hct.fromInt(this.tone(tone));
    }
  };
  var KeyColor = class {
    constructor(hue, requestedChroma) {
      this.hue = hue;
      this.requestedChroma = requestedChroma;
      this.chromaCache = /* @__PURE__ */ new Map();
      this.maxChromaValue = 200;
    }
    /**
     * Creates a key color from a [hue] and a [chroma].
     * The key color is the first tone, starting from T50, matching the given hue
     * and chroma.
     *
     * @return Key color [Hct]
     */
    create() {
      const pivotTone = 50;
      const toneStepSize = 1;
      const epsilon = 0.01;
      let lowerTone = 0;
      let upperTone = 100;
      while (lowerTone < upperTone) {
        const midTone = Math.floor((lowerTone + upperTone) / 2);
        const isAscending = this.maxChroma(midTone) < this.maxChroma(midTone + toneStepSize);
        const sufficientChroma = this.maxChroma(midTone) >= this.requestedChroma - epsilon;
        if (sufficientChroma) {
          if (Math.abs(lowerTone - pivotTone) < Math.abs(upperTone - pivotTone)) {
            upperTone = midTone;
          } else {
            if (lowerTone === midTone) {
              return Hct.from(this.hue, this.requestedChroma, lowerTone);
            }
            lowerTone = midTone;
          }
        } else {
          if (isAscending) {
            lowerTone = midTone + toneStepSize;
          } else {
            upperTone = midTone;
          }
        }
      }
      return Hct.from(this.hue, this.requestedChroma, lowerTone);
    }
    // Find the maximum chroma for a given tone
    maxChroma(tone) {
      if (this.chromaCache.has(tone)) {
        return this.chromaCache.get(tone);
      }
      const chroma = Hct.from(this.hue, this.maxChromaValue, tone).chroma;
      this.chromaCache.set(tone, chroma);
      return chroma;
    }
  };

  // temperature/temperature_cache.js
  var TemperatureCache = class _TemperatureCache {
    constructor(input) {
      this.input = input;
      this.hctsByTempCache = [];
      this.hctsByHueCache = [];
      this.tempsByHctCache = /* @__PURE__ */ new Map();
      this.inputRelativeTemperatureCache = -1;
      this.complementCache = null;
    }
    get hctsByTemp() {
      if (this.hctsByTempCache.length > 0) {
        return this.hctsByTempCache;
      }
      const hcts = this.hctsByHue.concat([this.input]);
      const temperaturesByHct = this.tempsByHct;
      hcts.sort((a, b) => temperaturesByHct.get(a) - temperaturesByHct.get(b));
      this.hctsByTempCache = hcts;
      return hcts;
    }
    get warmest() {
      return this.hctsByTemp[this.hctsByTemp.length - 1];
    }
    get coldest() {
      return this.hctsByTemp[0];
    }
    /**
     * A set of colors with differing hues, equidistant in temperature.
     *
     * In art, this is usually described as a set of 5 colors on a color wheel
     * divided into 12 sections. This method allows provision of either of those
     * values.
     *
     * Behavior is undefined when [count] or [divisions] is 0.
     * When divisions < count, colors repeat.
     *
     * [count] The number of colors to return, includes the input color.
     * [divisions] The number of divisions on the color wheel.
     */
    analogous(count = 5, divisions = 12) {
      const startHue = Math.round(this.input.hue);
      const startHct = this.hctsByHue[startHue];
      let lastTemp = this.relativeTemperature(startHct);
      const allColors = [startHct];
      let absoluteTotalTempDelta = 0;
      for (let i = 0; i < 360; i++) {
        const hue = sanitizeDegreesInt(startHue + i);
        const hct = this.hctsByHue[hue];
        const temp = this.relativeTemperature(hct);
        const tempDelta = Math.abs(temp - lastTemp);
        lastTemp = temp;
        absoluteTotalTempDelta += tempDelta;
      }
      let hueAddend = 1;
      const tempStep = absoluteTotalTempDelta / divisions;
      let totalTempDelta = 0;
      lastTemp = this.relativeTemperature(startHct);
      while (allColors.length < divisions) {
        const hue = sanitizeDegreesInt(startHue + hueAddend);
        const hct = this.hctsByHue[hue];
        const temp = this.relativeTemperature(hct);
        const tempDelta = Math.abs(temp - lastTemp);
        totalTempDelta += tempDelta;
        const desiredTotalTempDeltaForIndex = allColors.length * tempStep;
        let indexSatisfied = totalTempDelta >= desiredTotalTempDeltaForIndex;
        let indexAddend = 1;
        while (indexSatisfied && allColors.length < divisions) {
          allColors.push(hct);
          const desiredTotalTempDeltaForIndex2 = (allColors.length + indexAddend) * tempStep;
          indexSatisfied = totalTempDelta >= desiredTotalTempDeltaForIndex2;
          indexAddend++;
        }
        lastTemp = temp;
        hueAddend++;
        if (hueAddend > 360) {
          while (allColors.length < divisions) {
            allColors.push(hct);
          }
          break;
        }
      }
      const answers = [this.input];
      const increaseHueCount = Math.floor((count - 1) / 2);
      for (let i = 1; i < increaseHueCount + 1; i++) {
        let index = 0 - i;
        while (index < 0) {
          index = allColors.length + index;
        }
        if (index >= allColors.length) {
          index = index % allColors.length;
        }
        answers.splice(0, 0, allColors[index]);
      }
      const decreaseHueCount = count - increaseHueCount - 1;
      for (let i = 1; i < decreaseHueCount + 1; i++) {
        let index = i;
        while (index < 0) {
          index = allColors.length + index;
        }
        if (index >= allColors.length) {
          index = index % allColors.length;
        }
        answers.push(allColors[index]);
      }
      return answers;
    }
    /**
     * A color that complements the input color aesthetically.
     *
     * In art, this is usually described as being across the color wheel.
     * History of this shows intent as a color that is just as cool-warm as the
     * input color is warm-cool.
     */
    get complement() {
      if (this.complementCache != null) {
        return this.complementCache;
      }
      const coldestHue = this.coldest.hue;
      const coldestTemp = this.tempsByHct.get(this.coldest);
      const warmestHue = this.warmest.hue;
      const warmestTemp = this.tempsByHct.get(this.warmest);
      const range = warmestTemp - coldestTemp;
      const startHueIsColdestToWarmest = _TemperatureCache.isBetween(this.input.hue, coldestHue, warmestHue);
      const startHue = startHueIsColdestToWarmest ? warmestHue : coldestHue;
      const endHue = startHueIsColdestToWarmest ? coldestHue : warmestHue;
      const directionOfRotation = 1;
      let smallestError = 1e3;
      let answer = this.hctsByHue[Math.round(this.input.hue)];
      const complementRelativeTemp = 1 - this.inputRelativeTemperature;
      for (let hueAddend = 0; hueAddend <= 360; hueAddend += 1) {
        const hue = sanitizeDegreesDouble(startHue + directionOfRotation * hueAddend);
        if (!_TemperatureCache.isBetween(hue, startHue, endHue)) {
          continue;
        }
        const possibleAnswer = this.hctsByHue[Math.round(hue)];
        const relativeTemp = (this.tempsByHct.get(possibleAnswer) - coldestTemp) / range;
        const error = Math.abs(complementRelativeTemp - relativeTemp);
        if (error < smallestError) {
          smallestError = error;
          answer = possibleAnswer;
        }
      }
      this.complementCache = answer;
      return this.complementCache;
    }
    /**
     * Temperature relative to all colors with the same chroma and tone.
     * Value on a scale from 0 to 1.
     */
    relativeTemperature(hct) {
      const range = this.tempsByHct.get(this.warmest) - this.tempsByHct.get(this.coldest);
      const differenceFromColdest = this.tempsByHct.get(hct) - this.tempsByHct.get(this.coldest);
      if (range === 0) {
        return 0.5;
      }
      return differenceFromColdest / range;
    }
    /** Relative temperature of the input color. See [relativeTemperature]. */
    get inputRelativeTemperature() {
      if (this.inputRelativeTemperatureCache >= 0) {
        return this.inputRelativeTemperatureCache;
      }
      this.inputRelativeTemperatureCache = this.relativeTemperature(this.input);
      return this.inputRelativeTemperatureCache;
    }
    /** A Map with keys of HCTs in [hctsByTemp], values of raw temperature. */
    get tempsByHct() {
      if (this.tempsByHctCache.size > 0) {
        return this.tempsByHctCache;
      }
      const allHcts = this.hctsByHue.concat([this.input]);
      const temperaturesByHct = /* @__PURE__ */ new Map();
      for (const e of allHcts) {
        temperaturesByHct.set(e, _TemperatureCache.rawTemperature(e));
      }
      this.tempsByHctCache = temperaturesByHct;
      return temperaturesByHct;
    }
    /**
     * HCTs for all hues, with the same chroma/tone as the input.
     * Sorted ascending, hue 0 to 360.
     */
    get hctsByHue() {
      if (this.hctsByHueCache.length > 0) {
        return this.hctsByHueCache;
      }
      const hcts = [];
      for (let hue = 0; hue <= 360; hue += 1) {
        const colorAtHue = Hct.from(hue, this.input.chroma, this.input.tone);
        hcts.push(colorAtHue);
      }
      this.hctsByHueCache = hcts;
      return this.hctsByHueCache;
    }
    /** Determines if an angle is between two other angles, rotating clockwise. */
    static isBetween(angle, a, b) {
      if (a < b) {
        return a <= angle && angle <= b;
      }
      return a <= angle || angle <= b;
    }
    /**
     * Value representing cool-warm factor of a color.
     * Values below 0 are considered cool, above, warm.
     *
     * Color science has researched emotion and harmony, which art uses to select
     * colors. Warm-cool is the foundation of analogous and complementary colors.
     * See:
     * - Li-Chen Ou's Chapter 19 in Handbook of Color Psychology (2015).
     * - Josef Albers' Interaction of Color chapters 19 and 21.
     *
     * Implementation of Ou, Woodcock and Wright's algorithm, which uses
     * L*a*b* / LCH color space.
     * Return value has these properties:
     * - Values below 0 are cool, above 0 are warm.
     * - Lower bound: -0.52 - (chroma ^ 1.07 / 20). L*a*b* chroma is infinite.
     *   Assuming max of 130 chroma, -9.66.
     * - Upper bound: -0.52 + (chroma ^ 1.07 / 20). L*a*b* chroma is infinite.
     *   Assuming max of 130 chroma, 8.61.
     */
    static rawTemperature(color) {
      const lab = labFromArgb(color.toInt());
      const hue = sanitizeDegreesDouble(Math.atan2(lab[2], lab[1]) * 180 / Math.PI);
      const chroma = Math.sqrt(lab[1] * lab[1] + lab[2] * lab[2]);
      const temperature = -0.5 + 0.02 * Math.pow(chroma, 1.07) * Math.cos(sanitizeDegreesDouble(hue - 50) * Math.PI / 180);
      return temperature;
    }
  };

  // dynamiccolor/contrast_curve.js
  var ContrastCurve = class {
    /**
     * Creates a `ContrastCurve` object.
     *
     * @param low Value for contrast level -1.0
     * @param normal Value for contrast level 0.0
     * @param medium Value for contrast level 0.5
     * @param high Value for contrast level 1.0
     */
    constructor(low, normal, medium, high) {
      this.low = low;
      this.normal = normal;
      this.medium = medium;
      this.high = high;
    }
    /**
     * Returns the value at a given contrast level.
     *
     * @param contrastLevel The contrast level. 0.0 is the default (normal); -1.0
     *     is the lowest; 1.0 is the highest.
     * @return The value. For contrast ratios, a number between 1.0 and 21.0.
     */
    get(contrastLevel) {
      if (contrastLevel <= -1) {
        return this.low;
      } else if (contrastLevel < 0) {
        return lerp(this.low, this.normal, (contrastLevel - -1) / 1);
      } else if (contrastLevel < 0.5) {
        return lerp(this.normal, this.medium, (contrastLevel - 0) / 0.5);
      } else if (contrastLevel < 1) {
        return lerp(this.medium, this.high, (contrastLevel - 0.5) / 0.5);
      } else {
        return this.high;
      }
    }
  };

  // dynamiccolor/tone_delta_pair.js
  var ToneDeltaPair = class {
    /**
     * Documents a constraint in tone distance between two DynamicColors.
     *
     * The polarity is an adjective that describes "A", compared to "B".
     *
     * For instance, ToneDeltaPair(A, B, 15, 'darker', 'exact') states that
     * A's tone should be exactly 15 darker than B's.
     *
     * 'relative_darker' and 'relative_lighter' describes the tone adjustment
     * relative to the surface color trend (white in light mode; black in dark
     * mode). For instance, ToneDeltaPair(A, B, 10, 'relative_lighter',
     * 'farther') states that A should be at least 10 lighter than B in light
     * mode, and at least 10 darker than B in dark mode.
     *
     * @param roleA The first role in a pair.
     * @param roleB The second role in a pair.
     * @param delta Required difference between tones. Absolute value, negative
     * values have undefined behavior.
     * @param polarity The relative relation between tones of roleA and roleB,
     * as described above.
     * @param constraint How to fulfill the tone delta pair constraint.
     * @param stayTogether Whether these two roles should stay on the same side
     * of the "awkward zone" (T50-59). This is necessary for certain cases where
     * one role has two backgrounds.
     */
    constructor(roleA, roleB, delta, polarity, stayTogether, constraint) {
      this.roleA = roleA;
      this.roleB = roleB;
      this.delta = delta;
      this.polarity = polarity;
      this.stayTogether = stayTogether;
      this.constraint = constraint;
      this.constraint = constraint ?? "exact";
    }
  };

  // dynamiccolor/variant.js
  var Variant;
  (function(Variant2) {
    Variant2[Variant2["MONOCHROME"] = 0] = "MONOCHROME";
    Variant2[Variant2["NEUTRAL"] = 1] = "NEUTRAL";
    Variant2[Variant2["TONAL_SPOT"] = 2] = "TONAL_SPOT";
    Variant2[Variant2["VIBRANT"] = 3] = "VIBRANT";
    Variant2[Variant2["EXPRESSIVE"] = 4] = "EXPRESSIVE";
    Variant2[Variant2["FIDELITY"] = 5] = "FIDELITY";
    Variant2[Variant2["CONTENT"] = 6] = "CONTENT";
    Variant2[Variant2["RAINBOW"] = 7] = "RAINBOW";
    Variant2[Variant2["FRUIT_SALAD"] = 8] = "FRUIT_SALAD";
  })(Variant || (Variant = {}));

  // dynamiccolor/color_spec_2021.js
  function isFidelity(scheme) {
    return scheme.variant === Variant.FIDELITY || scheme.variant === Variant.CONTENT;
  }
  function isMonochrome(scheme) {
    return scheme.variant === Variant.MONOCHROME;
  }
  function findDesiredChromaByTone(hue, chroma, tone, byDecreasingTone) {
    let answer = tone;
    let closestToChroma = Hct.from(hue, chroma, tone);
    if (closestToChroma.chroma < chroma) {
      let chromaPeak = closestToChroma.chroma;
      while (closestToChroma.chroma < chroma) {
        answer += byDecreasingTone ? -1 : 1;
        const potentialSolution = Hct.from(hue, chroma, answer);
        if (chromaPeak > potentialSolution.chroma) {
          break;
        }
        if (Math.abs(potentialSolution.chroma - chroma) < 0.4) {
          break;
        }
        const potentialDelta = Math.abs(potentialSolution.chroma - chroma);
        const currentDelta = Math.abs(closestToChroma.chroma - chroma);
        if (potentialDelta < currentDelta) {
          closestToChroma = potentialSolution;
        }
        chromaPeak = Math.max(chromaPeak, potentialSolution.chroma);
      }
    }
    return answer;
  }
  var ColorSpecDelegateImpl2021 = class {
    ////////////////////////////////////////////////////////////////
    // Main Palettes                                              //
    ////////////////////////////////////////////////////////////////
    primaryPaletteKeyColor() {
      return DynamicColor.fromPalette({
        name: "primary_palette_key_color",
        palette: (s) => s.primaryPalette,
        tone: (s) => s.primaryPalette.keyColor.tone
      });
    }
    secondaryPaletteKeyColor() {
      return DynamicColor.fromPalette({
        name: "secondary_palette_key_color",
        palette: (s) => s.secondaryPalette,
        tone: (s) => s.secondaryPalette.keyColor.tone
      });
    }
    tertiaryPaletteKeyColor() {
      return DynamicColor.fromPalette({
        name: "tertiary_palette_key_color",
        palette: (s) => s.tertiaryPalette,
        tone: (s) => s.tertiaryPalette.keyColor.tone
      });
    }
    neutralPaletteKeyColor() {
      return DynamicColor.fromPalette({
        name: "neutral_palette_key_color",
        palette: (s) => s.neutralPalette,
        tone: (s) => s.neutralPalette.keyColor.tone
      });
    }
    neutralVariantPaletteKeyColor() {
      return DynamicColor.fromPalette({
        name: "neutral_variant_palette_key_color",
        palette: (s) => s.neutralVariantPalette,
        tone: (s) => s.neutralVariantPalette.keyColor.tone
      });
    }
    errorPaletteKeyColor() {
      return DynamicColor.fromPalette({
        name: "error_palette_key_color",
        palette: (s) => s.errorPalette,
        tone: (s) => s.errorPalette.keyColor.tone
      });
    }
    ////////////////////////////////////////////////////////////////
    // Surfaces [S]                                               //
    ////////////////////////////////////////////////////////////////
    background() {
      return DynamicColor.fromPalette({
        name: "background",
        palette: (s) => s.neutralPalette,
        tone: (s) => s.isDark ? 6 : 98,
        isBackground: true
      });
    }
    onBackground() {
      return DynamicColor.fromPalette({
        name: "on_background",
        palette: (s) => s.neutralPalette,
        tone: (s) => s.isDark ? 90 : 10,
        background: (s) => this.background(),
        contrastCurve: (s) => new ContrastCurve(3, 3, 4.5, 7)
      });
    }
    surface() {
      return DynamicColor.fromPalette({
        name: "surface",
        palette: (s) => s.neutralPalette,
        tone: (s) => s.isDark ? 6 : 98,
        isBackground: true
      });
    }
    surfaceDim() {
      return DynamicColor.fromPalette({
        name: "surface_dim",
        palette: (s) => s.neutralPalette,
        tone: (s) => s.isDark ? 6 : new ContrastCurve(87, 87, 80, 75).get(s.contrastLevel),
        isBackground: true
      });
    }
    surfaceBright() {
      return DynamicColor.fromPalette({
        name: "surface_bright",
        palette: (s) => s.neutralPalette,
        tone: (s) => s.isDark ? new ContrastCurve(24, 24, 29, 34).get(s.contrastLevel) : 98,
        isBackground: true
      });
    }
    surfaceContainerLowest() {
      return DynamicColor.fromPalette({
        name: "surface_container_lowest",
        palette: (s) => s.neutralPalette,
        tone: (s) => s.isDark ? new ContrastCurve(4, 4, 2, 0).get(s.contrastLevel) : 100,
        isBackground: true
      });
    }
    surfaceContainerLow() {
      return DynamicColor.fromPalette({
        name: "surface_container_low",
        palette: (s) => s.neutralPalette,
        tone: (s) => s.isDark ? new ContrastCurve(10, 10, 11, 12).get(s.contrastLevel) : new ContrastCurve(96, 96, 96, 95).get(s.contrastLevel),
        isBackground: true
      });
    }
    surfaceContainer() {
      return DynamicColor.fromPalette({
        name: "surface_container",
        palette: (s) => s.neutralPalette,
        tone: (s) => s.isDark ? new ContrastCurve(12, 12, 16, 20).get(s.contrastLevel) : new ContrastCurve(94, 94, 92, 90).get(s.contrastLevel),
        isBackground: true
      });
    }
    surfaceContainerHigh() {
      return DynamicColor.fromPalette({
        name: "surface_container_high",
        palette: (s) => s.neutralPalette,
        tone: (s) => s.isDark ? new ContrastCurve(17, 17, 21, 25).get(s.contrastLevel) : new ContrastCurve(92, 92, 88, 85).get(s.contrastLevel),
        isBackground: true
      });
    }
    surfaceContainerHighest() {
      return DynamicColor.fromPalette({
        name: "surface_container_highest",
        palette: (s) => s.neutralPalette,
        tone: (s) => s.isDark ? new ContrastCurve(22, 22, 26, 30).get(s.contrastLevel) : new ContrastCurve(90, 90, 84, 80).get(s.contrastLevel),
        isBackground: true
      });
    }
    onSurface() {
      return DynamicColor.fromPalette({
        name: "on_surface",
        palette: (s) => s.neutralPalette,
        tone: (s) => s.isDark ? 90 : 10,
        background: (s) => this.highestSurface(s),
        contrastCurve: (s) => new ContrastCurve(4.5, 7, 11, 21)
      });
    }
    surfaceVariant() {
      return DynamicColor.fromPalette({
        name: "surface_variant",
        palette: (s) => s.neutralVariantPalette,
        tone: (s) => s.isDark ? 30 : 90,
        isBackground: true
      });
    }
    onSurfaceVariant() {
      return DynamicColor.fromPalette({
        name: "on_surface_variant",
        palette: (s) => s.neutralVariantPalette,
        tone: (s) => s.isDark ? 80 : 30,
        background: (s) => this.highestSurface(s),
        contrastCurve: (s) => new ContrastCurve(3, 4.5, 7, 11)
      });
    }
    inverseSurface() {
      return DynamicColor.fromPalette({
        name: "inverse_surface",
        palette: (s) => s.neutralPalette,
        tone: (s) => s.isDark ? 90 : 20,
        isBackground: true
      });
    }
    inverseOnSurface() {
      return DynamicColor.fromPalette({
        name: "inverse_on_surface",
        palette: (s) => s.neutralPalette,
        tone: (s) => s.isDark ? 20 : 95,
        background: (s) => this.inverseSurface(),
        contrastCurve: (s) => new ContrastCurve(4.5, 7, 11, 21)
      });
    }
    outline() {
      return DynamicColor.fromPalette({
        name: "outline",
        palette: (s) => s.neutralVariantPalette,
        tone: (s) => s.isDark ? 60 : 50,
        background: (s) => this.highestSurface(s),
        contrastCurve: (s) => new ContrastCurve(1.5, 3, 4.5, 7)
      });
    }
    outlineVariant() {
      return DynamicColor.fromPalette({
        name: "outline_variant",
        palette: (s) => s.neutralVariantPalette,
        tone: (s) => s.isDark ? 30 : 80,
        background: (s) => this.highestSurface(s),
        contrastCurve: (s) => new ContrastCurve(1, 1, 3, 4.5)
      });
    }
    shadow() {
      return DynamicColor.fromPalette({
        name: "shadow",
        palette: (s) => s.neutralPalette,
        tone: (s) => 0
      });
    }
    scrim() {
      return DynamicColor.fromPalette({
        name: "scrim",
        palette: (s) => s.neutralPalette,
        tone: (s) => 0
      });
    }
    surfaceTint() {
      return DynamicColor.fromPalette({
        name: "surface_tint",
        palette: (s) => s.primaryPalette,
        tone: (s) => s.isDark ? 80 : 40,
        isBackground: true
      });
    }
    ////////////////////////////////////////////////////////////////
    // Primary [P].                                               //
    ////////////////////////////////////////////////////////////////
    primary() {
      return DynamicColor.fromPalette({
        name: "primary",
        palette: (s) => s.primaryPalette,
        tone: (s) => {
          if (isMonochrome(s)) {
            return s.isDark ? 100 : 0;
          }
          return s.isDark ? 80 : 40;
        },
        isBackground: true,
        background: (s) => this.highestSurface(s),
        contrastCurve: (s) => new ContrastCurve(3, 4.5, 7, 7),
        toneDeltaPair: (s) => new ToneDeltaPair(this.primaryContainer(), this.primary(), 10, "nearer", false)
      });
    }
    primaryDim() {
      return void 0;
    }
    onPrimary() {
      return DynamicColor.fromPalette({
        name: "on_primary",
        palette: (s) => s.primaryPalette,
        tone: (s) => {
          if (isMonochrome(s)) {
            return s.isDark ? 10 : 90;
          }
          return s.isDark ? 20 : 100;
        },
        background: (s) => this.primary(),
        contrastCurve: (s) => new ContrastCurve(4.5, 7, 11, 21)
      });
    }
    primaryContainer() {
      return DynamicColor.fromPalette({
        name: "primary_container",
        palette: (s) => s.primaryPalette,
        tone: (s) => {
          if (isFidelity(s)) {
            return s.sourceColorHct.tone;
          }
          if (isMonochrome(s)) {
            return s.isDark ? 85 : 25;
          }
          return s.isDark ? 30 : 90;
        },
        isBackground: true,
        background: (s) => this.highestSurface(s),
        contrastCurve: (s) => new ContrastCurve(1, 1, 3, 4.5),
        toneDeltaPair: (s) => new ToneDeltaPair(this.primaryContainer(), this.primary(), 10, "nearer", false)
      });
    }
    onPrimaryContainer() {
      return DynamicColor.fromPalette({
        name: "on_primary_container",
        palette: (s) => s.primaryPalette,
        tone: (s) => {
          if (isFidelity(s)) {
            return DynamicColor.foregroundTone(this.primaryContainer().tone(s), 4.5);
          }
          if (isMonochrome(s)) {
            return s.isDark ? 0 : 100;
          }
          return s.isDark ? 90 : 30;
        },
        background: (s) => this.primaryContainer(),
        contrastCurve: (s) => new ContrastCurve(3, 4.5, 7, 11)
      });
    }
    inversePrimary() {
      return DynamicColor.fromPalette({
        name: "inverse_primary",
        palette: (s) => s.primaryPalette,
        tone: (s) => s.isDark ? 40 : 80,
        background: (s) => this.inverseSurface(),
        contrastCurve: (s) => new ContrastCurve(3, 4.5, 7, 7)
      });
    }
    /////////////////////////////////////////////////////////////////
    // Secondary [Q].                                              //
    /////////////////////////////////////////////////////////////////
    secondary() {
      return DynamicColor.fromPalette({
        name: "secondary",
        palette: (s) => s.secondaryPalette,
        tone: (s) => s.isDark ? 80 : 40,
        isBackground: true,
        background: (s) => this.highestSurface(s),
        contrastCurve: (s) => new ContrastCurve(3, 4.5, 7, 7),
        toneDeltaPair: (s) => new ToneDeltaPair(this.secondaryContainer(), this.secondary(), 10, "nearer", false)
      });
    }
    secondaryDim() {
      return void 0;
    }
    onSecondary() {
      return DynamicColor.fromPalette({
        name: "on_secondary",
        palette: (s) => s.secondaryPalette,
        tone: (s) => {
          if (isMonochrome(s)) {
            return s.isDark ? 10 : 100;
          } else {
            return s.isDark ? 20 : 100;
          }
        },
        background: (s) => this.secondary(),
        contrastCurve: (s) => new ContrastCurve(4.5, 7, 11, 21)
      });
    }
    secondaryContainer() {
      return DynamicColor.fromPalette({
        name: "secondary_container",
        palette: (s) => s.secondaryPalette,
        tone: (s) => {
          const initialTone = s.isDark ? 30 : 90;
          if (isMonochrome(s)) {
            return s.isDark ? 30 : 85;
          }
          if (!isFidelity(s)) {
            return initialTone;
          }
          return findDesiredChromaByTone(s.secondaryPalette.hue, s.secondaryPalette.chroma, initialTone, s.isDark ? false : true);
        },
        isBackground: true,
        background: (s) => this.highestSurface(s),
        contrastCurve: (s) => new ContrastCurve(1, 1, 3, 4.5),
        toneDeltaPair: (s) => new ToneDeltaPair(this.secondaryContainer(), this.secondary(), 10, "nearer", false)
      });
    }
    onSecondaryContainer() {
      return DynamicColor.fromPalette({
        name: "on_secondary_container",
        palette: (s) => s.secondaryPalette,
        tone: (s) => {
          if (isMonochrome(s)) {
            return s.isDark ? 90 : 10;
          }
          if (!isFidelity(s)) {
            return s.isDark ? 90 : 30;
          }
          return DynamicColor.foregroundTone(this.secondaryContainer().tone(s), 4.5);
        },
        background: (s) => this.secondaryContainer(),
        contrastCurve: (s) => new ContrastCurve(3, 4.5, 7, 11)
      });
    }
    /////////////////////////////////////////////////////////////////
    // Tertiary [T].                                               //
    /////////////////////////////////////////////////////////////////
    tertiary() {
      return DynamicColor.fromPalette({
        name: "tertiary",
        palette: (s) => s.tertiaryPalette,
        tone: (s) => {
          if (isMonochrome(s)) {
            return s.isDark ? 90 : 25;
          }
          return s.isDark ? 80 : 40;
        },
        isBackground: true,
        background: (s) => this.highestSurface(s),
        contrastCurve: (s) => new ContrastCurve(3, 4.5, 7, 7),
        toneDeltaPair: (s) => new ToneDeltaPair(this.tertiaryContainer(), this.tertiary(), 10, "nearer", false)
      });
    }
    tertiaryDim() {
      return void 0;
    }
    onTertiary() {
      return DynamicColor.fromPalette({
        name: "on_tertiary",
        palette: (s) => s.tertiaryPalette,
        tone: (s) => {
          if (isMonochrome(s)) {
            return s.isDark ? 10 : 90;
          }
          return s.isDark ? 20 : 100;
        },
        background: (s) => this.tertiary(),
        contrastCurve: (s) => new ContrastCurve(4.5, 7, 11, 21)
      });
    }
    tertiaryContainer() {
      return DynamicColor.fromPalette({
        name: "tertiary_container",
        palette: (s) => s.tertiaryPalette,
        tone: (s) => {
          if (isMonochrome(s)) {
            return s.isDark ? 60 : 49;
          }
          if (!isFidelity(s)) {
            return s.isDark ? 30 : 90;
          }
          const proposedHct = s.tertiaryPalette.getHct(s.sourceColorHct.tone);
          return DislikeAnalyzer.fixIfDisliked(proposedHct).tone;
        },
        isBackground: true,
        background: (s) => this.highestSurface(s),
        contrastCurve: (s) => new ContrastCurve(1, 1, 3, 4.5),
        toneDeltaPair: (s) => new ToneDeltaPair(this.tertiaryContainer(), this.tertiary(), 10, "nearer", false)
      });
    }
    onTertiaryContainer() {
      return DynamicColor.fromPalette({
        name: "on_tertiary_container",
        palette: (s) => s.tertiaryPalette,
        tone: (s) => {
          if (isMonochrome(s)) {
            return s.isDark ? 0 : 100;
          }
          if (!isFidelity(s)) {
            return s.isDark ? 90 : 30;
          }
          return DynamicColor.foregroundTone(this.tertiaryContainer().tone(s), 4.5);
        },
        background: (s) => this.tertiaryContainer(),
        contrastCurve: (s) => new ContrastCurve(3, 4.5, 7, 11)
      });
    }
    //////////////////////////////////////////////////////////////////
    // Error [E].                                                   //
    //////////////////////////////////////////////////////////////////
    error() {
      return DynamicColor.fromPalette({
        name: "error",
        palette: (s) => s.errorPalette,
        tone: (s) => s.isDark ? 80 : 40,
        isBackground: true,
        background: (s) => this.highestSurface(s),
        contrastCurve: (s) => new ContrastCurve(3, 4.5, 7, 7),
        toneDeltaPair: (s) => new ToneDeltaPair(this.errorContainer(), this.error(), 10, "nearer", false)
      });
    }
    errorDim() {
      return void 0;
    }
    onError() {
      return DynamicColor.fromPalette({
        name: "on_error",
        palette: (s) => s.errorPalette,
        tone: (s) => s.isDark ? 20 : 100,
        background: (s) => this.error(),
        contrastCurve: (s) => new ContrastCurve(4.5, 7, 11, 21)
      });
    }
    errorContainer() {
      return DynamicColor.fromPalette({
        name: "error_container",
        palette: (s) => s.errorPalette,
        tone: (s) => s.isDark ? 30 : 90,
        isBackground: true,
        background: (s) => this.highestSurface(s),
        contrastCurve: (s) => new ContrastCurve(1, 1, 3, 4.5),
        toneDeltaPair: (s) => new ToneDeltaPair(this.errorContainer(), this.error(), 10, "nearer", false)
      });
    }
    onErrorContainer() {
      return DynamicColor.fromPalette({
        name: "on_error_container",
        palette: (s) => s.errorPalette,
        tone: (s) => {
          if (isMonochrome(s)) {
            return s.isDark ? 90 : 10;
          }
          return s.isDark ? 90 : 30;
        },
        background: (s) => this.errorContainer(),
        contrastCurve: (s) => new ContrastCurve(3, 4.5, 7, 11)
      });
    }
    //////////////////////////////////////////////////////////////////
    // Primary Fixed [PF]                                           //
    //////////////////////////////////////////////////////////////////
    primaryFixed() {
      return DynamicColor.fromPalette({
        name: "primary_fixed",
        palette: (s) => s.primaryPalette,
        tone: (s) => isMonochrome(s) ? 40 : 90,
        isBackground: true,
        background: (s) => this.highestSurface(s),
        contrastCurve: (s) => new ContrastCurve(1, 1, 3, 4.5),
        toneDeltaPair: (s) => new ToneDeltaPair(this.primaryFixed(), this.primaryFixedDim(), 10, "lighter", true)
      });
    }
    primaryFixedDim() {
      return DynamicColor.fromPalette({
        name: "primary_fixed_dim",
        palette: (s) => s.primaryPalette,
        tone: (s) => isMonochrome(s) ? 30 : 80,
        isBackground: true,
        background: (s) => this.highestSurface(s),
        contrastCurve: (s) => new ContrastCurve(1, 1, 3, 4.5),
        toneDeltaPair: (s) => new ToneDeltaPair(this.primaryFixed(), this.primaryFixedDim(), 10, "lighter", true)
      });
    }
    onPrimaryFixed() {
      return DynamicColor.fromPalette({
        name: "on_primary_fixed",
        palette: (s) => s.primaryPalette,
        tone: (s) => isMonochrome(s) ? 100 : 10,
        background: (s) => this.primaryFixedDim(),
        secondBackground: (s) => this.primaryFixed(),
        contrastCurve: (s) => new ContrastCurve(4.5, 7, 11, 21)
      });
    }
    onPrimaryFixedVariant() {
      return DynamicColor.fromPalette({
        name: "on_primary_fixed_variant",
        palette: (s) => s.primaryPalette,
        tone: (s) => isMonochrome(s) ? 90 : 30,
        background: (s) => this.primaryFixedDim(),
        secondBackground: (s) => this.primaryFixed(),
        contrastCurve: (s) => new ContrastCurve(3, 4.5, 7, 11)
      });
    }
    ///////////////////////////////////////////////////////////////////
    // Secondary Fixed [QF]                                          //
    ///////////////////////////////////////////////////////////////////
    secondaryFixed() {
      return DynamicColor.fromPalette({
        name: "secondary_fixed",
        palette: (s) => s.secondaryPalette,
        tone: (s) => isMonochrome(s) ? 80 : 90,
        isBackground: true,
        background: (s) => this.highestSurface(s),
        contrastCurve: (s) => new ContrastCurve(1, 1, 3, 4.5),
        toneDeltaPair: (s) => new ToneDeltaPair(this.secondaryFixed(), this.secondaryFixedDim(), 10, "lighter", true)
      });
    }
    secondaryFixedDim() {
      return DynamicColor.fromPalette({
        name: "secondary_fixed_dim",
        palette: (s) => s.secondaryPalette,
        tone: (s) => isMonochrome(s) ? 70 : 80,
        isBackground: true,
        background: (s) => this.highestSurface(s),
        contrastCurve: (s) => new ContrastCurve(1, 1, 3, 4.5),
        toneDeltaPair: (s) => new ToneDeltaPair(this.secondaryFixed(), this.secondaryFixedDim(), 10, "lighter", true)
      });
    }
    onSecondaryFixed() {
      return DynamicColor.fromPalette({
        name: "on_secondary_fixed",
        palette: (s) => s.secondaryPalette,
        tone: (s) => 10,
        background: (s) => this.secondaryFixedDim(),
        secondBackground: (s) => this.secondaryFixed(),
        contrastCurve: (s) => new ContrastCurve(4.5, 7, 11, 21)
      });
    }
    onSecondaryFixedVariant() {
      return DynamicColor.fromPalette({
        name: "on_secondary_fixed_variant",
        palette: (s) => s.secondaryPalette,
        tone: (s) => isMonochrome(s) ? 25 : 30,
        background: (s) => this.secondaryFixedDim(),
        secondBackground: (s) => this.secondaryFixed(),
        contrastCurve: (s) => new ContrastCurve(3, 4.5, 7, 11)
      });
    }
    /////////////////////////////////////////////////////////////////
    // Tertiary Fixed [TF]                                         //
    /////////////////////////////////////////////////////////////////
    tertiaryFixed() {
      return DynamicColor.fromPalette({
        name: "tertiary_fixed",
        palette: (s) => s.tertiaryPalette,
        tone: (s) => isMonochrome(s) ? 40 : 90,
        isBackground: true,
        background: (s) => this.highestSurface(s),
        contrastCurve: (s) => new ContrastCurve(1, 1, 3, 4.5),
        toneDeltaPair: (s) => new ToneDeltaPair(this.tertiaryFixed(), this.tertiaryFixedDim(), 10, "lighter", true)
      });
    }
    tertiaryFixedDim() {
      return DynamicColor.fromPalette({
        name: "tertiary_fixed_dim",
        palette: (s) => s.tertiaryPalette,
        tone: (s) => isMonochrome(s) ? 30 : 80,
        isBackground: true,
        background: (s) => this.highestSurface(s),
        contrastCurve: (s) => new ContrastCurve(1, 1, 3, 4.5),
        toneDeltaPair: (s) => new ToneDeltaPair(this.tertiaryFixed(), this.tertiaryFixedDim(), 10, "lighter", true)
      });
    }
    onTertiaryFixed() {
      return DynamicColor.fromPalette({
        name: "on_tertiary_fixed",
        palette: (s) => s.tertiaryPalette,
        tone: (s) => isMonochrome(s) ? 100 : 10,
        background: (s) => this.tertiaryFixedDim(),
        secondBackground: (s) => this.tertiaryFixed(),
        contrastCurve: (s) => new ContrastCurve(4.5, 7, 11, 21)
      });
    }
    onTertiaryFixedVariant() {
      return DynamicColor.fromPalette({
        name: "on_tertiary_fixed_variant",
        palette: (s) => s.tertiaryPalette,
        tone: (s) => isMonochrome(s) ? 90 : 30,
        background: (s) => this.tertiaryFixedDim(),
        secondBackground: (s) => this.tertiaryFixed(),
        contrastCurve: (s) => new ContrastCurve(3, 4.5, 7, 11)
      });
    }
    ////////////////////////////////////////////////////////////////
    // Other                                                      //
    ////////////////////////////////////////////////////////////////
    highestSurface(s) {
      return s.isDark ? this.surfaceBright() : this.surfaceDim();
    }
  };

  // dynamiccolor/dynamic_color.ts
  function validateExtendedColor2(originalColor, specVersion, extendedColor) {
    if (originalColor.name !== extendedColor.name) {
      throw new Error(
        `Attempting to extend color ${originalColor.name} with color ${extendedColor.name} of different name for spec version ${specVersion}.`
      );
    }
    if (originalColor.isBackground !== extendedColor.isBackground) {
      throw new Error(`Attempting to extend color ${originalColor.name} as a ${originalColor.isBackground ? "background" : "foreground"} with color ${extendedColor.name} as a ${extendedColor.isBackground ? "background" : "foreground"} for spec version ${specVersion}.`);
    }
  }
  function extendSpecVersion2(originlColor, specVersion, extendedColor) {
    validateExtendedColor2(originlColor, specVersion, extendedColor);
    return DynamicColor2.fromPalette({
      name: originlColor.name,
      palette: (s) => s.specVersion === specVersion ? extendedColor.palette(s) : originlColor.palette(s),
      tone: (s) => s.specVersion === specVersion ? extendedColor.tone(s) : originlColor.tone(s),
      isBackground: originlColor.isBackground,
      chromaMultiplier: (s) => {
        const chromaMultiplier = s.specVersion === specVersion ? extendedColor.chromaMultiplier : originlColor.chromaMultiplier;
        return chromaMultiplier !== void 0 ? chromaMultiplier(s) : 1;
      },
      background: (s) => {
        const background = s.specVersion === specVersion ? extendedColor.background : originlColor.background;
        return background !== void 0 ? background(s) : void 0;
      },
      secondBackground: (s) => {
        const secondBackground = s.specVersion === specVersion ? extendedColor.secondBackground : originlColor.secondBackground;
        return secondBackground !== void 0 ? secondBackground(s) : void 0;
      },
      contrastCurve: (s) => {
        const contrastCurve = s.specVersion === specVersion ? extendedColor.contrastCurve : originlColor.contrastCurve;
        return contrastCurve !== void 0 ? contrastCurve(s) : void 0;
      },
      toneDeltaPair: (s) => {
        const toneDeltaPair = s.specVersion === specVersion ? extendedColor.toneDeltaPair : originlColor.toneDeltaPair;
        return toneDeltaPair !== void 0 ? toneDeltaPair(s) : void 0;
      }
    });
  }
  var DynamicColor2 = class _DynamicColor {
    /**
     * The base constructor for DynamicColor.
     *
     * _Strongly_ prefer using one of the convenience constructors. This class is
     * arguably too flexible to ensure it can support any scenario. Functional
     * arguments allow  overriding without risks that come with subclasses.
     *
     * For example, the default behavior of adjust tone at max contrast
     * to be at a 7.0 ratio with its background is principled and
     * matches accessibility guidance. That does not mean it's the desired
     * approach for _every_ design system, and every color pairing,
     * always, in every case.
     *
     * @param name The name of the dynamic color. Defaults to empty.
     * @param palette Function that provides a TonalPalette given DynamicScheme. A
     *     TonalPalette is defined by a hue and chroma, so this replaces the need
     *     to specify hue/chroma. By providing a tonal palette, when contrast
     *     adjustments are made, intended chroma can be preserved.
     * @param tone Function that provides a tone, given a DynamicScheme.
     * @param isBackground Whether this dynamic color is a background, with some
     *     other color as the foreground. Defaults to false.
     * @param chromaMultiplier A factor that multiplies the chroma for this color.
     * @param background The background of the dynamic color (as a function of a
     *     `DynamicScheme`), if it exists.
     * @param secondBackground A second background of the dynamic color (as a
     *     function of a `DynamicScheme`), if it exists.
     * @param contrastCurve A `ContrastCurve` object specifying how its contrast
     *     against its background should behave in various contrast levels
     *     options.
     * @param toneDeltaPair A `ToneDeltaPair` object specifying a tone delta
     *     constraint between two colors. One of them must be the color being
     *     constructed.
     */
    constructor(name, palette, tone, isBackground, chromaMultiplier, background, secondBackground, contrastCurve, toneDeltaPair) {
      this.name = name;
      this.palette = palette;
      this.tone = tone;
      this.isBackground = isBackground;
      this.chromaMultiplier = chromaMultiplier;
      this.background = background;
      this.secondBackground = secondBackground;
      this.contrastCurve = contrastCurve;
      this.toneDeltaPair = toneDeltaPair;
      this.hctCache = /* @__PURE__ */ new Map();
      if (!background && secondBackground) {
        throw new Error(
          `Color ${name} has secondBackgrounddefined, but background is not defined.`
        );
      }
      if (!background && contrastCurve) {
        throw new Error(
          `Color ${name} has contrastCurvedefined, but background is not defined.`
        );
      }
      if (background && !contrastCurve) {
        throw new Error(
          `Color ${name} has backgrounddefined, but contrastCurve is not defined.`
        );
      }
    }
    /**
     * Create a DynamicColor defined by a TonalPalette and HCT tone.
     *
     * @param args Functions with DynamicScheme as input. Must provide a palette
     *     and tone. May provide a background DynamicColor and ToneDeltaPair.
     */
    static fromPalette(args) {
      return new _DynamicColor(
        args.name ?? "",
        args.palette,
        args.tone ?? _DynamicColor.getInitialToneFromBackground(args.background),
        args.isBackground ?? false,
        args.chromaMultiplier,
        args.background,
        args.secondBackground,
        args.contrastCurve,
        args.toneDeltaPair
      );
    }
    static getInitialToneFromBackground(background) {
      if (background === void 0) {
        return (s) => 50;
      }
      return (s) => background(s) ? background(s).getTone(s) : 50;
    }
    /**
     * Returns a deep copy of this DynamicColor.
     */
    clone() {
      return _DynamicColor.fromPalette({
        name: this.name,
        palette: this.palette,
        tone: this.tone,
        isBackground: this.isBackground,
        chromaMultiplier: this.chromaMultiplier,
        background: this.background,
        secondBackground: this.secondBackground,
        contrastCurve: this.contrastCurve,
        toneDeltaPair: this.toneDeltaPair
      });
    }
    /**
     * Clears the cache of HCT values for this color. For testing or debugging
     * purposes.
     */
    clearCache() {
      this.hctCache.clear();
    }
    /**
     * Returns a ARGB integer (i.e. a hex code).
     *
     * @param scheme Defines the conditions of the user interface, for example,
     *     whether or not it is dark mode or light mode, and what the desired
     *     contrast level is.
     */
    getArgb(scheme) {
      return this.getHct(scheme).toInt();
    }
    /**
     * Returns a color, expressed in the HCT color space, that this
     * DynamicColor is under the conditions in scheme.
     *
     * @param scheme Defines the conditions of the user interface, for example,
     *     whether or not it is dark mode or light mode, and what the desired
     *     contrast level is.
     */
    getHct(scheme) {
      const cachedAnswer = this.hctCache.get(scheme);
      if (cachedAnswer != null) {
        return cachedAnswer;
      }
      const answer = getSpec2(scheme.specVersion).getHct(scheme, this);
      if (this.hctCache.size > 4) {
        this.hctCache.clear();
      }
      this.hctCache.set(scheme, answer);
      return answer;
    }
    /**
     * Returns a tone, T in the HCT color space, that this DynamicColor is under
     * the conditions in scheme.
     *
     * @param scheme Defines the conditions of the user interface, for example,
     *     whether or not it is dark mode or light mode, and what the desired
     *     contrast level is.
     */
    getTone(scheme) {
      return getSpec2(scheme.specVersion).getTone(scheme, this);
    }
    /**
     * Given a background tone, finds a foreground tone, while ensuring they reach
     * a contrast ratio that is as close to [ratio] as possible.
     *
     * @param bgTone Tone in HCT. Range is 0 to 100, undefined behavior when it
     *     falls outside that range.
     * @param ratio The contrast ratio desired between bgTone and the return
     *     value.
     */
    static foregroundTone(bgTone, ratio) {
      const lighterTone = Contrast.lighterUnsafe(bgTone, ratio);
      const darkerTone = Contrast.darkerUnsafe(bgTone, ratio);
      const lighterRatio = Contrast.ratioOfTones(lighterTone, bgTone);
      const darkerRatio = Contrast.ratioOfTones(darkerTone, bgTone);
      const preferLighter = _DynamicColor.tonePrefersLightForeground(bgTone);
      if (preferLighter) {
        const negligibleDifference = Math.abs(lighterRatio - darkerRatio) < 0.1 && lighterRatio < ratio && darkerRatio < ratio;
        return lighterRatio >= ratio || lighterRatio >= darkerRatio || negligibleDifference ? lighterTone : darkerTone;
      } else {
        return darkerRatio >= ratio || darkerRatio >= lighterRatio ? darkerTone : lighterTone;
      }
    }
    /**
     * Returns whether [tone] prefers a light foreground.
     *
     * People prefer white foregrounds on ~T60-70. Observed over time, and also
     * by Andrew Somers during research for APCA.
     *
     * T60 used as to create the smallest discontinuity possible when skipping
     * down to T49 in order to ensure light foregrounds.
     * Since `tertiaryContainer` in dark monochrome scheme requires a tone of
     * 60, it should not be adjusted. Therefore, 60 is excluded here.
     */
    static tonePrefersLightForeground(tone) {
      return Math.round(tone) < 60;
    }
    /**
     * Returns whether [tone] can reach a contrast ratio of 4.5 with a lighter
     * color.
     */
    static toneAllowsLightForeground(tone) {
      return Math.round(tone) <= 49;
    }
    /**
     * Adjusts a tone such that white has 4.5 contrast, if the tone is
     * reasonably close to supporting it.
     */
    static enableLightForeground(tone) {
      if (_DynamicColor.tonePrefersLightForeground(tone) && !_DynamicColor.toneAllowsLightForeground(tone)) {
        return 49;
      }
      return tone;
    }
  };
  var ColorCalculationDelegateImpl20212 = class {
    getHct(scheme, color) {
      const tone = color.getTone(scheme);
      const palette = color.palette(scheme);
      return palette.getHct(tone);
    }
    getTone(scheme, color) {
      const decreasingContrast = scheme.contrastLevel < 0;
      const toneDeltaPair = color.toneDeltaPair ? color.toneDeltaPair(scheme) : void 0;
      if (toneDeltaPair) {
        const roleA = toneDeltaPair.roleA;
        const roleB = toneDeltaPair.roleB;
        const delta = toneDeltaPair.delta;
        const polarity = toneDeltaPair.polarity;
        const stayTogether = toneDeltaPair.stayTogether;
        const aIsNearer = polarity === "nearer" || polarity === "lighter" && !scheme.isDark || polarity === "darker" && scheme.isDark;
        const nearer = aIsNearer ? roleA : roleB;
        const farther = aIsNearer ? roleB : roleA;
        const amNearer = color.name === nearer.name;
        const expansionDir = scheme.isDark ? 1 : -1;
        let nTone = nearer.tone(scheme);
        let fTone = farther.tone(scheme);
        if (color.background && nearer.contrastCurve && farther.contrastCurve) {
          const bg = color.background(scheme);
          const nContrastCurve = nearer.contrastCurve(scheme);
          const fContrastCurve = farther.contrastCurve(scheme);
          if (bg && nContrastCurve && fContrastCurve) {
            const bgTone = bg.getTone(scheme);
            const nContrast = nContrastCurve.get(scheme.contrastLevel);
            const fContrast = fContrastCurve.get(scheme.contrastLevel);
            if (Contrast.ratioOfTones(bgTone, nTone) < nContrast) {
              nTone = DynamicColor2.foregroundTone(bgTone, nContrast);
            }
            if (Contrast.ratioOfTones(bgTone, fTone) < fContrast) {
              fTone = DynamicColor2.foregroundTone(bgTone, fContrast);
            }
            if (decreasingContrast) {
              nTone = DynamicColor2.foregroundTone(bgTone, nContrast);
              fTone = DynamicColor2.foregroundTone(bgTone, fContrast);
            }
          }
        }
        if ((fTone - nTone) * expansionDir < delta) {
          fTone = clampDouble(0, 100, nTone + delta * expansionDir);
          if ((fTone - nTone) * expansionDir >= delta) {
          } else {
            nTone = clampDouble(0, 100, fTone - delta * expansionDir);
          }
        }
        if (50 <= nTone && nTone < 60) {
          if (expansionDir > 0) {
            nTone = 60;
            fTone = Math.max(fTone, nTone + delta * expansionDir);
          } else {
            nTone = 49;
            fTone = Math.min(fTone, nTone + delta * expansionDir);
          }
        } else if (50 <= fTone && fTone < 60) {
          if (stayTogether) {
            if (expansionDir > 0) {
              nTone = 60;
              fTone = Math.max(fTone, nTone + delta * expansionDir);
            } else {
              nTone = 49;
              fTone = Math.min(fTone, nTone + delta * expansionDir);
            }
          } else {
            if (expansionDir > 0) {
              fTone = 60;
            } else {
              fTone = 49;
            }
          }
        }
        return amNearer ? nTone : fTone;
      } else {
        let answer = color.tone(scheme);
        if (color.background == void 0 || color.background(scheme) === void 0 || color.contrastCurve == void 0 || color.contrastCurve(scheme) === void 0) {
          return answer;
        }
        const bgTone = color.background(scheme).getTone(scheme);
        const desiredRatio = color.contrastCurve(scheme).get(scheme.contrastLevel);
        if (Contrast.ratioOfTones(bgTone, answer) >= desiredRatio) {
        } else {
          answer = DynamicColor2.foregroundTone(bgTone, desiredRatio);
        }
        if (decreasingContrast) {
          answer = DynamicColor2.foregroundTone(bgTone, desiredRatio);
        }
        if (color.isBackground && 50 <= answer && answer < 60) {
          if (Contrast.ratioOfTones(49, bgTone) >= desiredRatio) {
            answer = 49;
          } else {
            answer = 60;
          }
        }
        if (color.secondBackground == void 0 || color.secondBackground(scheme) === void 0) {
          return answer;
        }
        const [bg1, bg2] = [color.background, color.secondBackground];
        const [bgTone1, bgTone2] = [bg1(scheme).getTone(scheme), bg2(scheme).getTone(scheme)];
        const [upper, lower] = [Math.max(bgTone1, bgTone2), Math.min(bgTone1, bgTone2)];
        if (Contrast.ratioOfTones(upper, answer) >= desiredRatio && Contrast.ratioOfTones(lower, answer) >= desiredRatio) {
          return answer;
        }
        const lightOption = Contrast.lighter(upper, desiredRatio);
        const darkOption = Contrast.darker(lower, desiredRatio);
        const availables = [];
        if (lightOption !== -1) availables.push(lightOption);
        if (darkOption !== -1) availables.push(darkOption);
        const prefersLight = DynamicColor2.tonePrefersLightForeground(bgTone1) || DynamicColor2.tonePrefersLightForeground(bgTone2);
        if (prefersLight) {
          return lightOption < 0 ? 100 : lightOption;
        }
        if (availables.length === 1) {
          return availables[0];
        }
        return darkOption < 0 ? 0 : darkOption;
      }
    }
  };
  var ColorCalculationDelegateImpl20252 = class {
    getHct(scheme, color) {
      const palette = color.palette(scheme);
      const tone = color.getTone(scheme);
      const hue = palette.hue;
      const chroma = palette.chroma * (color.chromaMultiplier ? color.chromaMultiplier(scheme) : 1);
      return Hct.from(hue, chroma, tone);
    }
    getTone(scheme, color) {
      const toneDeltaPair = color.toneDeltaPair ? color.toneDeltaPair(scheme) : void 0;
      if (toneDeltaPair) {
        const roleA = toneDeltaPair.roleA;
        const roleB = toneDeltaPair.roleB;
        const polarity = toneDeltaPair.polarity;
        const constraint = toneDeltaPair.constraint;
        const absoluteDelta = polarity === "darker" || polarity === "relative_lighter" && scheme.isDark || polarity === "relative_darker" && !scheme.isDark ? -toneDeltaPair.delta : toneDeltaPair.delta;
        const amRoleA = color.name === roleA.name;
        const selfRole = amRoleA ? roleA : roleB;
        const refRole = amRoleA ? roleB : roleA;
        let selfTone = selfRole.tone(scheme);
        let refTone = refRole.getTone(scheme);
        const relativeDelta = absoluteDelta * (amRoleA ? 1 : -1);
        if (constraint === "exact") {
          selfTone = clampDouble(0, 100, refTone + relativeDelta);
        } else if (constraint === "nearer") {
          if (relativeDelta > 0) {
            selfTone = clampDouble(
              0,
              100,
              clampDouble(refTone, refTone + relativeDelta, selfTone)
            );
          } else {
            selfTone = clampDouble(
              0,
              100,
              clampDouble(refTone + relativeDelta, refTone, selfTone)
            );
          }
        } else if (constraint === "farther") {
          if (relativeDelta > 0) {
            selfTone = clampDouble(refTone + relativeDelta, 100, selfTone);
          } else {
            selfTone = clampDouble(0, refTone + relativeDelta, selfTone);
          }
        }
        if (color.background && color.contrastCurve) {
          const background = color.background(scheme);
          const contrastCurve = color.contrastCurve(scheme);
          if (background && contrastCurve) {
            const bgTone = background.getTone(scheme);
            const selfContrast = contrastCurve.get(scheme.contrastLevel);
            selfTone = Contrast.ratioOfTones(bgTone, selfTone) >= selfContrast && scheme.contrastLevel >= 0 ? selfTone : DynamicColor2.foregroundTone(bgTone, selfContrast);
          }
        }
        if (color.isBackground && !color.name.endsWith("_fixed_dim")) {
          if (selfTone >= 57) {
            selfTone = clampDouble(65, 100, selfTone);
          } else {
            selfTone = clampDouble(0, 49, selfTone);
          }
        }
        return selfTone;
      } else {
        let answer = color.tone(scheme);
        if (color.background == void 0 || color.background(scheme) === void 0 || color.contrastCurve == void 0 || color.contrastCurve(scheme) === void 0) {
          return answer;
        }
        const bgTone = color.background(scheme).getTone(scheme);
        const desiredRatio = color.contrastCurve(scheme).get(scheme.contrastLevel);
        answer = Contrast.ratioOfTones(bgTone, answer) >= desiredRatio && scheme.contrastLevel >= 0 ? answer : DynamicColor2.foregroundTone(bgTone, desiredRatio);
        if (color.isBackground && !color.name.endsWith("_fixed_dim")) {
          if (answer >= 57) {
            answer = clampDouble(65, 100, answer);
          } else {
            answer = clampDouble(0, 49, answer);
          }
        }
        if (color.secondBackground == void 0 || color.secondBackground(scheme) === void 0) {
          return answer;
        }
        const [bg1, bg2] = [color.background, color.secondBackground];
        const [bgTone1, bgTone2] = [bg1(scheme).getTone(scheme), bg2(scheme).getTone(scheme)];
        const [upper, lower] = [Math.max(bgTone1, bgTone2), Math.min(bgTone1, bgTone2)];
        if (Contrast.ratioOfTones(upper, answer) >= desiredRatio && Contrast.ratioOfTones(lower, answer) >= desiredRatio) {
          return answer;
        }
        const lightOption = Contrast.lighter(upper, desiredRatio);
        const darkOption = Contrast.darker(lower, desiredRatio);
        const availables = [];
        if (lightOption !== -1) availables.push(lightOption);
        if (darkOption !== -1) availables.push(darkOption);
        const prefersLight = DynamicColor2.tonePrefersLightForeground(bgTone1) || DynamicColor2.tonePrefersLightForeground(bgTone2);
        if (prefersLight) {
          return lightOption < 0 ? 100 : lightOption;
        }
        if (availables.length === 1) {
          return availables[0];
        }
        return darkOption < 0 ? 0 : darkOption;
      }
    }
  };
  var spec20212 = new ColorCalculationDelegateImpl20212();
  var spec20252 = new ColorCalculationDelegateImpl20252();
  function getSpec2(specVersion) {
    return specVersion === "2025" ? spec20252 : spec20212;
  }

  // dynamiccolor/color_spec_2025.js
  function tMaxC(palette, lowerBound = 0, upperBound = 100) {
    let answer = findBestToneForChroma(palette.hue, palette.chroma, 100, true);
    return clampDouble(lowerBound, upperBound, answer);
  }
  function tMinC(palette, lowerBound = 0, upperBound = 100) {
    let answer = findBestToneForChroma(palette.hue, palette.chroma, 0, false);
    return clampDouble(lowerBound, upperBound, answer);
  }
  function findBestToneForChroma(hue, chroma, tone, byDecreasingTone) {
    let answer = tone;
    let bestCandidate = Hct.from(hue, chroma, answer);
    while (bestCandidate.chroma < chroma) {
      if (tone < 0 || tone > 100) {
        break;
      }
      tone += byDecreasingTone ? -1 : 1;
      const newCandidate = Hct.from(hue, chroma, tone);
      if (bestCandidate.chroma < newCandidate.chroma) {
        bestCandidate = newCandidate;
        answer = tone;
      }
    }
    return answer;
  }
  function getCurve(defaultContrast) {
    if (defaultContrast === 1.5) {
      return new ContrastCurve(1.5, 1.5, 3, 4.5);
    } else if (defaultContrast === 3) {
      return new ContrastCurve(3, 3, 4.5, 7);
    } else if (defaultContrast === 4.5) {
      return new ContrastCurve(4.5, 4.5, 7, 11);
    } else if (defaultContrast === 6) {
      return new ContrastCurve(6, 6, 7, 11);
    } else if (defaultContrast === 7) {
      return new ContrastCurve(7, 7, 11, 21);
    } else if (defaultContrast === 9) {
      return new ContrastCurve(9, 9, 11, 21);
    } else if (defaultContrast === 11) {
      return new ContrastCurve(11, 11, 21, 21);
    } else if (defaultContrast === 21) {
      return new ContrastCurve(21, 21, 21, 21);
    } else {
      return new ContrastCurve(defaultContrast, defaultContrast, 7, 21);
    }
  }
  var ColorSpecDelegateImpl2025 = class extends ColorSpecDelegateImpl2021 {
    ////////////////////////////////////////////////////////////////
    // Surfaces [S]                                               //
    ////////////////////////////////////////////////////////////////
    surface() {
      const color2025 = DynamicColor2.fromPalette({
        name: "surface",
        palette: (s) => s.neutralPalette,
        tone: (s) => {
          super.surface().tone(s);
          if (s.platform === "phone") {
            if (s.isDark) {
              return 4;
            } else {
              if (s.neutralPalette.keyColor.isYellow()) {
                return 99;
              } else if (s.variant === Variant.VIBRANT) {
                return 97;
              } else {
                return 98;
              }
            }
          } else {
            return 0;
          }
        },
        isBackground: true
      });
      return extendSpecVersion2(super.surface(), "2025", color2025);
    }
    surfaceDim() {
      const color2025 = DynamicColor2.fromPalette({
        name: "surface_dim",
        palette: (s) => s.neutralPalette,
        tone: (s) => {
          if (s.isDark) {
            return 4;
          } else {
            if (s.neutralPalette.keyColor.isYellow()) {
              return 90;
            } else if (s.variant === Variant.VIBRANT) {
              return 85;
            } else {
              return 87;
            }
          }
        },
        isBackground: true,
        chromaMultiplier: (s) => {
          if (!s.isDark) {
            if (s.variant === Variant.NEUTRAL) {
              return 2.5;
            } else if (s.variant === Variant.TONAL_SPOT) {
              return 1.7;
            } else if (s.variant === Variant.EXPRESSIVE) {
              return s.neutralPalette.keyColor.isYellow() ? 2.7 : 1.75;
            } else if (s.variant === Variant.VIBRANT) {
              return 1.36;
            }
          }
          return 1;
        }
      });
      return extendSpecVersion2(super.surfaceDim(), "2025", color2025);
    }
    surfaceBright() {
      const color2025 = DynamicColor2.fromPalette({
        name: "surface_bright",
        palette: (s) => s.neutralPalette,
        tone: (s) => {
          if (s.isDark) {
            return 18;
          } else {
            if (s.neutralPalette.keyColor.isYellow()) {
              return 99;
            } else if (s.variant === Variant.VIBRANT) {
              return 97;
            } else {
              return 98;
            }
          }
        },
        isBackground: true,
        chromaMultiplier: (s) => {
          if (s.isDark) {
            if (s.variant === Variant.NEUTRAL) {
              return 2.5;
            } else if (s.variant === Variant.TONAL_SPOT) {
              return 1.7;
            } else if (s.variant === Variant.EXPRESSIVE) {
              return s.neutralPalette.keyColor.isYellow() ? 2.7 : 1.75;
            } else if (s.variant === Variant.VIBRANT) {
              return 1.36;
            }
          }
          return 1;
        }
      });
      return extendSpecVersion2(super.surfaceBright(), "2025", color2025);
    }
    surfaceContainerLowest() {
      const color2025 = DynamicColor2.fromPalette({
        name: "surface_container_lowest",
        palette: (s) => s.neutralPalette,
        tone: (s) => s.isDark ? 0 : 100,
        isBackground: true
      });
      return extendSpecVersion2(super.surfaceContainerLowest(), "2025", color2025);
    }
    surfaceContainerLow() {
      const color2025 = DynamicColor2.fromPalette({
        name: "surface_container_low",
        palette: (s) => s.neutralPalette,
        tone: (s) => {
          if (s.platform === "phone") {
            if (s.isDark) {
              return 6;
            } else {
              if (s.neutralPalette.keyColor.isYellow()) {
                return 98;
              } else if (s.variant === Variant.VIBRANT) {
                return 95;
              } else {
                return 96;
              }
            }
          } else {
            return 15;
          }
        },
        isBackground: true,
        chromaMultiplier: (s) => {
          if (s.platform === "phone") {
            if (s.variant === Variant.NEUTRAL) {
              return 1.3;
            } else if (s.variant === Variant.TONAL_SPOT) {
              return 1.25;
            } else if (s.variant === Variant.EXPRESSIVE) {
              return s.neutralPalette.keyColor.isYellow() ? 1.3 : 1.15;
            } else if (s.variant === Variant.VIBRANT) {
              return 1.08;
            }
          }
          return 1;
        }
      });
      return extendSpecVersion2(super.surfaceContainerLow(), "2025", color2025);
    }
    surfaceContainer() {
      const color2025 = DynamicColor2.fromPalette({
        name: "surface_container",
        palette: (s) => s.neutralPalette,
        tone: (s) => {
          if (s.platform === "phone") {
            if (s.isDark) {
              return 9;
            } else {
              if (s.neutralPalette.keyColor.isYellow()) {
                return 96;
              } else if (s.variant === Variant.VIBRANT) {
                return 92;
              } else {
                return 94;
              }
            }
          } else {
            return 20;
          }
        },
        isBackground: true,
        chromaMultiplier: (s) => {
          if (s.platform === "phone") {
            if (s.variant === Variant.NEUTRAL) {
              return 1.6;
            } else if (s.variant === Variant.TONAL_SPOT) {
              return 1.4;
            } else if (s.variant === Variant.EXPRESSIVE) {
              return s.neutralPalette.keyColor.isYellow() ? 1.6 : 1.3;
            } else if (s.variant === Variant.VIBRANT) {
              return 1.15;
            }
          }
          return 1;
        }
      });
      return extendSpecVersion2(super.surfaceContainer(), "2025", color2025);
    }
    surfaceContainerHigh() {
      const color2025 = DynamicColor2.fromPalette({
        name: "surface_container_high",
        palette: (s) => s.neutralPalette,
        tone: (s) => {
          if (s.platform === "phone") {
            if (s.isDark) {
              return 12;
            } else {
              if (s.neutralPalette.keyColor.isYellow()) {
                return 94;
              } else if (s.variant === Variant.VIBRANT) {
                return 90;
              } else {
                return 92;
              }
            }
          } else {
            return 25;
          }
        },
        isBackground: true,
        chromaMultiplier: (s) => {
          if (s.platform === "phone") {
            if (s.variant === Variant.NEUTRAL) {
              return 1.9;
            } else if (s.variant === Variant.TONAL_SPOT) {
              return 1.5;
            } else if (s.variant === Variant.EXPRESSIVE) {
              return s.neutralPalette.keyColor.isYellow() ? 1.95 : 1.45;
            } else if (s.variant === Variant.VIBRANT) {
              return 1.22;
            }
          }
          return 1;
        }
      });
      return extendSpecVersion2(super.surfaceContainerHigh(), "2025", color2025);
    }
    surfaceContainerHighest() {
      const color2025 = DynamicColor2.fromPalette({
        name: "surface_container_highest",
        palette: (s) => s.neutralPalette,
        tone: (s) => {
          if (s.isDark) {
            return 15;
          } else {
            if (s.neutralPalette.keyColor.isYellow()) {
              return 92;
            } else if (s.variant === Variant.VIBRANT) {
              return 88;
            } else {
              return 90;
            }
          }
        },
        isBackground: true,
        chromaMultiplier: (s) => {
          if (s.variant === Variant.NEUTRAL) {
            return 2.2;
          } else if (s.variant === Variant.TONAL_SPOT) {
            return 1.7;
          } else if (s.variant === Variant.EXPRESSIVE) {
            return s.neutralPalette.keyColor.isYellow() ? 2.3 : 1.6;
          } else if (s.variant === Variant.VIBRANT) {
            return 1.29;
          } else {
            return 1;
          }
        }
      });
      return extendSpecVersion2(super.surfaceContainerHighest(), "2025", color2025);
    }
    onSurface() {
      const color2025 = DynamicColor2.fromPalette({
        name: "on_surface",
        palette: (s) => s.neutralPalette,
        chromaMultiplier: (s) => {
          if (s.platform === "phone") {
            if (s.variant === Variant.NEUTRAL) {
              return 2.2;
            } else if (s.variant === Variant.TONAL_SPOT) {
              return 1.7;
            } else if (s.variant === Variant.EXPRESSIVE) {
              return s.neutralPalette.keyColor.isYellow() ? 2.3 : 1.6;
            } else if (s.variant === Variant.VIBRANT) {
              return 1.29;
            }
          }
          return 1;
        },
        background: (s) => s.platform === "phone" ? this.highestSurface(s) : this.surfaceContainerHigh(),
        contrastCurve: (s) => getCurve(9)
      });
      return extendSpecVersion2(super.onSurface(), "2025", color2025);
    }
    onSurfaceVariant() {
      const color2025 = DynamicColor2.fromPalette({
        name: "on_surface_variant",
        palette: (s) => s.neutralPalette,
        chromaMultiplier: (s) => {
          if (s.platform === "phone") {
            if (s.variant === Variant.NEUTRAL) {
              return 2.2;
            } else if (s.variant === Variant.TONAL_SPOT) {
              return 1.7;
            } else if (s.variant === Variant.EXPRESSIVE) {
              return s.neutralPalette.keyColor.isYellow() ? 2.3 : 1.6;
            } else if (s.variant === Variant.VIBRANT) {
              return 1.29;
            }
          }
          return 1;
        },
        background: (s) => s.platform === "phone" ? this.highestSurface(s) : this.surfaceContainerHigh(),
        contrastCurve: (s) => s.platform === "phone" ? getCurve(4.5) : getCurve(7)
      });
      return extendSpecVersion2(super.onSurfaceVariant(), "2025", color2025);
    }
    outline() {
      const color2025 = DynamicColor2.fromPalette({
        name: "outline",
        palette: (s) => s.neutralPalette,
        chromaMultiplier: (s) => {
          if (s.platform === "phone") {
            if (s.variant === Variant.NEUTRAL) {
              return 2.2;
            } else if (s.variant === Variant.TONAL_SPOT) {
              return 1.7;
            } else if (s.variant === Variant.EXPRESSIVE) {
              return s.neutralPalette.keyColor.isYellow() ? 2.3 : 1.6;
            } else if (s.variant === Variant.VIBRANT) {
              return 1.29;
            }
          }
          return 1;
        },
        background: (s) => s.platform === "phone" ? this.highestSurface(s) : this.surfaceContainerHigh(),
        contrastCurve: (s) => s.platform === "phone" ? getCurve(3) : getCurve(4.5)
      });
      return extendSpecVersion2(super.outline(), "2025", color2025);
    }
    outlineVariant() {
      const color2025 = DynamicColor2.fromPalette({
        name: "outline_variant",
        palette: (s) => s.neutralPalette,
        chromaMultiplier: (s) => {
          if (s.platform === "phone") {
            if (s.variant === Variant.NEUTRAL) {
              return 2.2;
            } else if (s.variant === Variant.TONAL_SPOT) {
              return 1.7;
            } else if (s.variant === Variant.EXPRESSIVE) {
              return s.neutralPalette.keyColor.isYellow() ? 2.3 : 1.6;
            } else if (s.variant === Variant.VIBRANT) {
              return 1.29;
            }
          }
          return 1;
        },
        background: (s) => s.platform === "phone" ? this.highestSurface(s) : this.surfaceContainerHigh(),
        contrastCurve: (s) => s.platform === "phone" ? getCurve(1.5) : getCurve(3)
      });
      return extendSpecVersion2(super.outlineVariant(), "2025", color2025);
    }
    inverseSurface() {
      const color2025 = DynamicColor2.fromPalette({
        name: "inverse_surface",
        palette: (s) => s.neutralPalette,
        tone: (s) => s.isDark ? 98 : 4,
        isBackground: true
      });
      return extendSpecVersion2(super.inverseSurface(), "2025", color2025);
    }
    inverseOnSurface() {
      const color2025 = DynamicColor2.fromPalette({
        name: "inverse_on_surface",
        palette: (s) => s.neutralPalette,
        background: (s) => this.inverseSurface(),
        contrastCurve: (s) => getCurve(7)
      });
      return extendSpecVersion2(super.inverseOnSurface(), "2025", color2025);
    }
    ////////////////////////////////////////////////////////////////
    // Primaries [P]                                              //
    ////////////////////////////////////////////////////////////////
    primary() {
      const color2025 = DynamicColor2.fromPalette({
        name: "primary",
        palette: (s) => s.primaryPalette,
        tone: (s) => {
          if (s.variant === Variant.NEUTRAL) {
            if (s.platform === "phone") {
              return s.isDark ? 80 : 40;
            } else {
              return 90;
            }
          } else if (s.variant === Variant.TONAL_SPOT) {
            if (s.platform === "phone") {
              if (s.isDark) {
                return 80;
              } else {
                return tMaxC(s.primaryPalette);
              }
            } else {
              return tMaxC(s.primaryPalette, 0, 90);
            }
          } else if (s.variant === Variant.EXPRESSIVE) {
            return tMaxC(s.primaryPalette, 0, s.primaryPalette.keyColor.isYellow() ? 25 : s.primaryPalette.keyColor.isCyan() ? 88 : 98);
          } else {
            return tMaxC(s.primaryPalette, 0, s.primaryPalette.keyColor.isCyan() ? 88 : 98);
          }
        },
        isBackground: true,
        background: (s) => s.platform === "phone" ? this.highestSurface(s) : this.surfaceContainerHigh(),
        contrastCurve: (s) => s.platform === "phone" ? getCurve(4.5) : getCurve(7),
        toneDeltaPair: (s) => s.platform === "phone" ? new ToneDeltaPair(this.primaryContainer(), this.primary(), 5, "relative_lighter", true, "farther") : void 0
      });
      return extendSpecVersion2(super.primary(), "2025", color2025);
    }
    primaryDim() {
      return DynamicColor2.fromPalette({
        name: "primary_dim",
        palette: (s) => s.primaryPalette,
        tone: (s) => {
          if (s.variant === Variant.NEUTRAL) {
            return 85;
          } else if (s.variant === Variant.TONAL_SPOT) {
            return tMaxC(s.primaryPalette, 0, 90);
          } else {
            return tMaxC(s.primaryPalette);
          }
        },
        isBackground: true,
        background: (s) => this.surfaceContainerHigh(),
        contrastCurve: (s) => getCurve(4.5),
        toneDeltaPair: (s) => new ToneDeltaPair(this.primaryDim(), this.primary(), 5, "darker", true, "farther")
      });
    }
    onPrimary() {
      const color2025 = DynamicColor2.fromPalette({
        name: "on_primary",
        palette: (s) => s.primaryPalette,
        background: (s) => s.platform === "phone" ? this.primary() : this.primaryDim(),
        contrastCurve: (s) => s.platform === "phone" ? getCurve(6) : getCurve(7)
      });
      return extendSpecVersion2(super.onPrimary(), "2025", color2025);
    }
    primaryContainer() {
      const color2025 = DynamicColor2.fromPalette({
        name: "primary_container",
        palette: (s) => s.primaryPalette,
        tone: (s) => {
          if (s.platform === "watch") {
            return 30;
          } else if (s.variant === Variant.NEUTRAL) {
            return s.isDark ? 30 : 90;
          } else if (s.variant === Variant.TONAL_SPOT) {
            return s.isDark ? tMinC(s.primaryPalette, 35, 93) : tMaxC(s.primaryPalette, 0, 90);
          } else if (s.variant === Variant.EXPRESSIVE) {
            return s.isDark ? tMaxC(s.primaryPalette, 30, 93) : tMaxC(s.primaryPalette, 78, s.primaryPalette.keyColor.isCyan() ? 88 : 90);
          } else {
            return s.isDark ? tMinC(s.primaryPalette, 66, 93) : tMaxC(s.primaryPalette, 66, s.primaryPalette.keyColor.isCyan() ? 88 : 93);
          }
        },
        isBackground: true,
        background: (s) => s.platform === "phone" ? this.highestSurface(s) : void 0,
        toneDeltaPair: (s) => s.platform === "phone" ? void 0 : new ToneDeltaPair(this.primaryContainer(), this.primaryDim(), 10, "darker", true, "farther"),
        contrastCurve: (s) => s.platform === "phone" && s.contrastLevel > 0 ? getCurve(1.5) : void 0
      });
      return extendSpecVersion2(super.primaryContainer(), "2025", color2025);
    }
    onPrimaryContainer() {
      const color2025 = DynamicColor2.fromPalette({
        name: "on_primary_container",
        palette: (s) => s.primaryPalette,
        background: (s) => this.primaryContainer(),
        contrastCurve: (s) => s.platform === "phone" ? getCurve(6) : getCurve(7)
      });
      return extendSpecVersion2(super.onPrimaryContainer(), "2025", color2025);
    }
    primaryFixed() {
      const color2025 = DynamicColor2.fromPalette({
        name: "primary_fixed",
        palette: (s) => s.primaryPalette,
        tone: (s) => {
          let tempS = Object.assign({}, s, { isDark: false });
          return this.primaryContainer().getTone(tempS);
        },
        isBackground: true
      });
      return extendSpecVersion2(super.primaryFixed(), "2025", color2025);
    }
    primaryFixedDim() {
      const color2025 = DynamicColor2.fromPalette({
        name: "primary_fixed_dim",
        palette: (s) => s.primaryPalette,
        tone: (s) => this.primaryFixed().getTone(s),
        isBackground: true,
        toneDeltaPair: (s) => new ToneDeltaPair(this.primaryFixedDim(), this.primaryFixed(), 5, "darker", true, "exact")
      });
      return extendSpecVersion2(super.primaryFixedDim(), "2025", color2025);
    }
    onPrimaryFixed() {
      const color2025 = DynamicColor2.fromPalette({
        name: "on_primary_fixed",
        palette: (s) => s.primaryPalette,
        background: (s) => this.primaryFixedDim(),
        contrastCurve: (s) => getCurve(7)
      });
      return extendSpecVersion2(super.onPrimaryFixed(), "2025", color2025);
    }
    onPrimaryFixedVariant() {
      const color2025 = DynamicColor2.fromPalette({
        name: "on_primary_fixed_variant",
        palette: (s) => s.primaryPalette,
        background: (s) => this.primaryFixedDim(),
        contrastCurve: (s) => getCurve(4.5)
      });
      return extendSpecVersion2(super.onPrimaryFixedVariant(), "2025", color2025);
    }
    inversePrimary() {
      const color2025 = DynamicColor2.fromPalette({
        name: "inverse_primary",
        palette: (s) => s.primaryPalette,
        tone: (s) => tMaxC(s.primaryPalette),
        background: (s) => this.inverseSurface(),
        contrastCurve: (s) => s.platform === "phone" ? getCurve(6) : getCurve(7)
      });
      return extendSpecVersion2(super.inversePrimary(), "2025", color2025);
    }
    ////////////////////////////////////////////////////////////////
    // Secondaries [Q]                                            //
    ////////////////////////////////////////////////////////////////
    secondary() {
      const color2025 = DynamicColor2.fromPalette({
        name: "secondary",
        palette: (s) => s.secondaryPalette,
        tone: (s) => {
          if (s.platform === "watch") {
            return s.variant === Variant.NEUTRAL ? 90 : tMaxC(s.secondaryPalette, 0, 90);
          } else if (s.variant === Variant.NEUTRAL) {
            return s.isDark ? tMinC(s.secondaryPalette, 0, 98) : tMaxC(s.secondaryPalette);
          } else if (s.variant === Variant.VIBRANT) {
            return tMaxC(s.secondaryPalette, 0, s.isDark ? 90 : 98);
          } else {
            return s.isDark ? 80 : tMaxC(s.secondaryPalette);
          }
        },
        isBackground: true,
        background: (s) => s.platform === "phone" ? this.highestSurface(s) : this.surfaceContainerHigh(),
        contrastCurve: (s) => s.platform === "phone" ? getCurve(4.5) : getCurve(7),
        toneDeltaPair: (s) => s.platform === "phone" ? new ToneDeltaPair(this.secondaryContainer(), this.secondary(), 5, "relative_lighter", true, "farther") : void 0
      });
      return extendSpecVersion2(super.secondary(), "2025", color2025);
    }
    secondaryDim() {
      return DynamicColor2.fromPalette({
        name: "secondary_dim",
        palette: (s) => s.secondaryPalette,
        tone: (s) => {
          if (s.variant === Variant.NEUTRAL) {
            return 85;
          } else {
            return tMaxC(s.secondaryPalette, 0, 90);
          }
        },
        isBackground: true,
        background: (s) => this.surfaceContainerHigh(),
        contrastCurve: (s) => getCurve(4.5),
        toneDeltaPair: (s) => new ToneDeltaPair(this.secondaryDim(), this.secondary(), 5, "darker", true, "farther")
      });
    }
    onSecondary() {
      const color2025 = DynamicColor2.fromPalette({
        name: "on_secondary",
        palette: (s) => s.secondaryPalette,
        background: (s) => s.platform === "phone" ? this.secondary() : this.secondaryDim(),
        contrastCurve: (s) => s.platform === "phone" ? getCurve(6) : getCurve(7)
      });
      return extendSpecVersion2(super.onSecondary(), "2025", color2025);
    }
    secondaryContainer() {
      const color2025 = DynamicColor2.fromPalette({
        name: "secondary_container",
        palette: (s) => s.secondaryPalette,
        tone: (s) => {
          if (s.platform === "watch") {
            return 30;
          } else if (s.variant === Variant.VIBRANT) {
            return s.isDark ? tMinC(s.secondaryPalette, 30, 40) : tMaxC(s.secondaryPalette, 84, 90);
          } else if (s.variant === Variant.EXPRESSIVE) {
            return s.isDark ? 15 : tMaxC(s.secondaryPalette, 90, 95);
          } else {
            return s.isDark ? 25 : 90;
          }
        },
        isBackground: true,
        background: (s) => s.platform === "phone" ? this.highestSurface(s) : void 0,
        toneDeltaPair: (s) => s.platform === "watch" ? new ToneDeltaPair(this.secondaryContainer(), this.secondaryDim(), 10, "darker", true, "farther") : void 0,
        contrastCurve: (s) => s.platform === "phone" && s.contrastLevel > 0 ? getCurve(1.5) : void 0
      });
      return extendSpecVersion2(super.secondaryContainer(), "2025", color2025);
    }
    onSecondaryContainer() {
      const color2025 = DynamicColor2.fromPalette({
        name: "on_secondary_container",
        palette: (s) => s.secondaryPalette,
        background: (s) => this.secondaryContainer(),
        contrastCurve: (s) => s.platform === "phone" ? getCurve(6) : getCurve(7)
      });
      return extendSpecVersion2(super.onSecondaryContainer(), "2025", color2025);
    }
    secondaryFixed() {
      const color2025 = DynamicColor2.fromPalette({
        name: "secondary_fixed",
        palette: (s) => s.secondaryPalette,
        tone: (s) => {
          let tempS = Object.assign({}, s, { isDark: false });
          return this.secondaryContainer().getTone(tempS);
        },
        isBackground: true
      });
      return extendSpecVersion2(super.secondaryFixed(), "2025", color2025);
    }
    secondaryFixedDim() {
      const color2025 = DynamicColor2.fromPalette({
        name: "secondary_fixed_dim",
        palette: (s) => s.secondaryPalette,
        tone: (s) => this.secondaryFixed().getTone(s),
        isBackground: true,
        toneDeltaPair: (s) => new ToneDeltaPair(this.secondaryFixedDim(), this.secondaryFixed(), 5, "darker", true, "exact")
      });
      return extendSpecVersion2(super.secondaryFixedDim(), "2025", color2025);
    }
    onSecondaryFixed() {
      const color2025 = DynamicColor2.fromPalette({
        name: "on_secondary_fixed",
        palette: (s) => s.secondaryPalette,
        background: (s) => this.secondaryFixedDim(),
        contrastCurve: (s) => getCurve(7)
      });
      return extendSpecVersion2(super.onSecondaryFixed(), "2025", color2025);
    }
    onSecondaryFixedVariant() {
      const color2025 = DynamicColor2.fromPalette({
        name: "on_secondary_fixed_variant",
        palette: (s) => s.secondaryPalette,
        background: (s) => this.secondaryFixedDim(),
        contrastCurve: (s) => getCurve(4.5)
      });
      return extendSpecVersion2(super.onSecondaryFixedVariant(), "2025", color2025);
    }
    ////////////////////////////////////////////////////////////////
    // Tertiaries [T]                                             //
    ////////////////////////////////////////////////////////////////
    tertiary() {
      const color2025 = DynamicColor2.fromPalette({
        name: "tertiary",
        palette: (s) => s.tertiaryPalette,
        tone: (s) => {
          if (s.platform === "watch") {
            return s.variant === Variant.TONAL_SPOT ? tMaxC(s.tertiaryPalette, 0, 90) : tMaxC(s.tertiaryPalette);
          } else if (s.variant === Variant.EXPRESSIVE || s.variant === Variant.VIBRANT) {
            return tMaxC(s.tertiaryPalette, 0, s.tertiaryPalette.keyColor.isCyan() ? 88 : s.isDark ? 98 : 100);
          } else {
            return s.isDark ? tMaxC(s.tertiaryPalette, 0, 98) : tMaxC(s.tertiaryPalette);
          }
        },
        isBackground: true,
        background: (s) => s.platform === "phone" ? this.highestSurface(s) : this.surfaceContainerHigh(),
        contrastCurve: (s) => s.platform === "phone" ? getCurve(4.5) : getCurve(7),
        toneDeltaPair: (s) => s.platform === "phone" ? new ToneDeltaPair(this.tertiaryContainer(), this.tertiary(), 5, "relative_lighter", true, "farther") : void 0
      });
      return extendSpecVersion2(super.tertiary(), "2025", color2025);
    }
    tertiaryDim() {
      return DynamicColor2.fromPalette({
        name: "tertiary_dim",
        palette: (s) => s.tertiaryPalette,
        tone: (s) => {
          if (s.variant === Variant.TONAL_SPOT) {
            return tMaxC(s.tertiaryPalette, 0, 90);
          } else {
            return tMaxC(s.tertiaryPalette);
          }
        },
        isBackground: true,
        background: (s) => this.surfaceContainerHigh(),
        contrastCurve: (s) => getCurve(4.5),
        toneDeltaPair: (s) => new ToneDeltaPair(this.tertiaryDim(), this.tertiary(), 5, "darker", true, "farther")
      });
    }
    onTertiary() {
      const color2025 = DynamicColor2.fromPalette({
        name: "on_tertiary",
        palette: (s) => s.tertiaryPalette,
        background: (s) => s.platform === "phone" ? this.tertiary() : this.tertiaryDim(),
        contrastCurve: (s) => s.platform === "phone" ? getCurve(6) : getCurve(7)
      });
      return extendSpecVersion2(super.onTertiary(), "2025", color2025);
    }
    tertiaryContainer() {
      const color2025 = DynamicColor2.fromPalette({
        name: "tertiary_container",
        palette: (s) => s.tertiaryPalette,
        tone: (s) => {
          if (s.platform === "watch") {
            return s.variant === Variant.TONAL_SPOT ? tMaxC(s.tertiaryPalette, 0, 90) : tMaxC(s.tertiaryPalette);
          } else {
            if (s.variant === Variant.NEUTRAL) {
              return s.isDark ? tMaxC(s.tertiaryPalette, 0, 93) : tMaxC(s.tertiaryPalette, 0, 96);
            } else if (s.variant === Variant.TONAL_SPOT) {
              return tMaxC(s.tertiaryPalette, 0, s.isDark ? 93 : 100);
            } else if (s.variant === Variant.EXPRESSIVE) {
              return tMaxC(s.tertiaryPalette, 75, s.tertiaryPalette.keyColor.isCyan() ? 88 : s.isDark ? 93 : 100);
            } else {
              return s.isDark ? tMaxC(s.tertiaryPalette, 0, 93) : tMaxC(s.tertiaryPalette, 72, 100);
            }
          }
        },
        isBackground: true,
        background: (s) => s.platform === "phone" ? this.highestSurface(s) : void 0,
        toneDeltaPair: (s) => s.platform === "watch" ? new ToneDeltaPair(this.tertiaryContainer(), this.tertiaryDim(), 10, "darker", true, "farther") : void 0,
        contrastCurve: (s) => s.platform === "phone" && s.contrastLevel > 0 ? getCurve(1.5) : void 0
      });
      return extendSpecVersion2(super.tertiaryContainer(), "2025", color2025);
    }
    onTertiaryContainer() {
      const color2025 = DynamicColor2.fromPalette({
        name: "on_tertiary_container",
        palette: (s) => s.tertiaryPalette,
        background: (s) => this.tertiaryContainer(),
        contrastCurve: (s) => s.platform === "phone" ? getCurve(6) : getCurve(7)
      });
      return extendSpecVersion2(super.onTertiaryContainer(), "2025", color2025);
    }
    tertiaryFixed() {
      const color2025 = DynamicColor2.fromPalette({
        name: "tertiary_fixed",
        palette: (s) => s.tertiaryPalette,
        tone: (s) => {
          let tempS = Object.assign({}, s, { isDark: false });
          return this.tertiaryContainer().getTone(tempS);
        },
        isBackground: true
      });
      return extendSpecVersion2(super.tertiaryFixed(), "2025", color2025);
    }
    tertiaryFixedDim() {
      const color2025 = DynamicColor2.fromPalette({
        name: "tertiary_fixed_dim",
        palette: (s) => s.tertiaryPalette,
        tone: (s) => this.tertiaryFixed().getTone(s),
        isBackground: true,
        toneDeltaPair: (s) => new ToneDeltaPair(this.tertiaryFixedDim(), this.tertiaryFixed(), 5, "darker", true, "exact")
      });
      return extendSpecVersion2(super.tertiaryFixedDim(), "2025", color2025);
    }
    onTertiaryFixed() {
      const color2025 = DynamicColor2.fromPalette({
        name: "on_tertiary_fixed",
        palette: (s) => s.tertiaryPalette,
        background: (s) => this.tertiaryFixedDim(),
        contrastCurve: (s) => getCurve(7)
      });
      return extendSpecVersion2(super.onTertiaryFixed(), "2025", color2025);
    }
    onTertiaryFixedVariant() {
      const color2025 = DynamicColor2.fromPalette({
        name: "on_tertiary_fixed_variant",
        palette: (s) => s.tertiaryPalette,
        background: (s) => this.tertiaryFixedDim(),
        contrastCurve: (s) => getCurve(4.5)
      });
      return extendSpecVersion2(super.onTertiaryFixedVariant(), "2025", color2025);
    }
    ////////////////////////////////////////////////////////////////
    // Errors [E]                                                 //
    ////////////////////////////////////////////////////////////////
    error() {
      const color2025 = DynamicColor2.fromPalette({
        name: "error",
        palette: (s) => s.errorPalette,
        tone: (s) => {
          if (s.platform === "phone") {
            return s.isDark ? tMinC(s.errorPalette, 0, 98) : tMaxC(s.errorPalette);
          } else {
            return tMinC(s.errorPalette);
          }
        },
        isBackground: true,
        background: (s) => s.platform === "phone" ? this.highestSurface(s) : this.surfaceContainerHigh(),
        contrastCurve: (s) => s.platform === "phone" ? getCurve(4.5) : getCurve(7),
        toneDeltaPair: (s) => s.platform === "phone" ? new ToneDeltaPair(this.errorContainer(), this.error(), 5, "relative_lighter", true, "farther") : void 0
      });
      return extendSpecVersion2(super.error(), "2025", color2025);
    }
    errorDim() {
      return DynamicColor2.fromPalette({
        name: "error_dim",
        palette: (s) => s.errorPalette,
        tone: (s) => tMinC(s.errorPalette),
        isBackground: true,
        background: (s) => this.surfaceContainerHigh(),
        contrastCurve: (s) => getCurve(4.5),
        toneDeltaPair: (s) => new ToneDeltaPair(this.errorDim(), this.error(), 5, "darker", true, "farther")
      });
    }
    onError() {
      const color2025 = DynamicColor2.fromPalette({
        name: "on_error",
        palette: (s) => s.errorPalette,
        background: (s) => s.platform === "phone" ? this.error() : this.errorDim(),
        contrastCurve: (s) => s.platform === "phone" ? getCurve(6) : getCurve(7)
      });
      return extendSpecVersion2(super.onError(), "2025", color2025);
    }
    errorContainer() {
      const color2025 = DynamicColor2.fromPalette({
        name: "error_container",
        palette: (s) => s.errorPalette,
        tone: (s) => {
          if (s.platform === "watch") {
            return 30;
          } else {
            return s.isDark ? tMinC(s.errorPalette, 30, 93) : tMaxC(s.errorPalette, 0, 90);
          }
        },
        isBackground: true,
        background: (s) => s.platform === "phone" ? this.highestSurface(s) : void 0,
        toneDeltaPair: (s) => s.platform === "watch" ? new ToneDeltaPair(this.errorContainer(), this.errorDim(), 10, "darker", true, "farther") : void 0,
        contrastCurve: (s) => s.platform === "phone" && s.contrastLevel > 0 ? getCurve(1.5) : void 0
      });
      return extendSpecVersion2(super.errorContainer(), "2025", color2025);
    }
    onErrorContainer() {
      const color2025 = DynamicColor2.fromPalette({
        name: "on_error_container",
        palette: (s) => s.errorPalette,
        background: (s) => this.errorContainer(),
        contrastCurve: (s) => s.platform === "phone" ? getCurve(4.5) : getCurve(7)
      });
      return extendSpecVersion2(super.onErrorContainer(), "2025", color2025);
    }
    /////////////////////////////////////////////////////////////////
    // Remapped Colors                                             //
    /////////////////////////////////////////////////////////////////
    surfaceVariant() {
      const color2025 = Object.assign(this.surfaceContainerHighest().clone(), { name: "surface_variant" });
      return extendSpecVersion2(super.surfaceVariant(), "2025", color2025);
    }
    surfaceTint() {
      const color2025 = Object.assign(this.primary().clone(), { name: "surface_tint" });
      return extendSpecVersion2(super.surfaceTint(), "2025", color2025);
    }
    background() {
      const color2025 = Object.assign(this.surface().clone(), { name: "background" });
      return extendSpecVersion2(super.background(), "2025", color2025);
    }
    onBackground() {
      const color2025 = Object.assign(this.onSurface().clone(), { name: "on_background" });
      return extendSpecVersion2(super.onBackground(), "2025", color2025);
    }
  };

  // dynamiccolor/material_dynamic_colors.js
  var MaterialDynamicColors = class _MaterialDynamicColors {
    constructor() {
      this.allColors = [
        this.background(),
        this.onBackground(),
        this.surface(),
        this.surfaceDim(),
        this.surfaceBright(),
        this.surfaceContainerLowest(),
        this.surfaceContainerLow(),
        this.surfaceContainer(),
        this.surfaceContainerHigh(),
        this.surfaceContainerHighest(),
        this.onSurface(),
        this.onSurfaceVariant(),
        this.outline(),
        this.outlineVariant(),
        this.inverseSurface(),
        this.inverseOnSurface(),
        this.primary(),
        this.primaryDim(),
        this.onPrimary(),
        this.primaryContainer(),
        this.onPrimaryContainer(),
        this.primaryFixed(),
        this.primaryFixedDim(),
        this.onPrimaryFixed(),
        this.onPrimaryFixedVariant(),
        this.inversePrimary(),
        this.secondary(),
        this.secondaryDim(),
        this.onSecondary(),
        this.secondaryContainer(),
        this.onSecondaryContainer(),
        this.secondaryFixed(),
        this.secondaryFixedDim(),
        this.onSecondaryFixed(),
        this.onSecondaryFixedVariant(),
        this.tertiary(),
        this.tertiaryDim(),
        this.onTertiary(),
        this.tertiaryContainer(),
        this.onTertiaryContainer(),
        this.tertiaryFixed(),
        this.tertiaryFixedDim(),
        this.onTertiaryFixed(),
        this.onTertiaryFixedVariant(),
        this.error(),
        this.errorDim(),
        this.onError(),
        this.errorContainer(),
        this.onErrorContainer()
      ].filter((c) => c !== void 0);
    }
    highestSurface(s) {
      return _MaterialDynamicColors.colorSpec.highestSurface(s);
    }
    ////////////////////////////////////////////////////////////////
    // Main Palettes                                              //
    ////////////////////////////////////////////////////////////////
    primaryPaletteKeyColor() {
      return _MaterialDynamicColors.colorSpec.primaryPaletteKeyColor();
    }
    secondaryPaletteKeyColor() {
      return _MaterialDynamicColors.colorSpec.secondaryPaletteKeyColor();
    }
    tertiaryPaletteKeyColor() {
      return _MaterialDynamicColors.colorSpec.tertiaryPaletteKeyColor();
    }
    neutralPaletteKeyColor() {
      return _MaterialDynamicColors.colorSpec.neutralPaletteKeyColor();
    }
    neutralVariantPaletteKeyColor() {
      return _MaterialDynamicColors.colorSpec.neutralVariantPaletteKeyColor();
    }
    errorPaletteKeyColor() {
      return _MaterialDynamicColors.colorSpec.errorPaletteKeyColor();
    }
    ////////////////////////////////////////////////////////////////
    // Surfaces [S]                                               //
    ////////////////////////////////////////////////////////////////
    background() {
      return _MaterialDynamicColors.colorSpec.background();
    }
    onBackground() {
      return _MaterialDynamicColors.colorSpec.onBackground();
    }
    surface() {
      return _MaterialDynamicColors.colorSpec.surface();
    }
    surfaceDim() {
      return _MaterialDynamicColors.colorSpec.surfaceDim();
    }
    surfaceBright() {
      return _MaterialDynamicColors.colorSpec.surfaceBright();
    }
    surfaceContainerLowest() {
      return _MaterialDynamicColors.colorSpec.surfaceContainerLowest();
    }
    surfaceContainerLow() {
      return _MaterialDynamicColors.colorSpec.surfaceContainerLow();
    }
    surfaceContainer() {
      return _MaterialDynamicColors.colorSpec.surfaceContainer();
    }
    surfaceContainerHigh() {
      return _MaterialDynamicColors.colorSpec.surfaceContainerHigh();
    }
    surfaceContainerHighest() {
      return _MaterialDynamicColors.colorSpec.surfaceContainerHighest();
    }
    onSurface() {
      return _MaterialDynamicColors.colorSpec.onSurface();
    }
    surfaceVariant() {
      return _MaterialDynamicColors.colorSpec.surfaceVariant();
    }
    onSurfaceVariant() {
      return _MaterialDynamicColors.colorSpec.onSurfaceVariant();
    }
    outline() {
      return _MaterialDynamicColors.colorSpec.outline();
    }
    outlineVariant() {
      return _MaterialDynamicColors.colorSpec.outlineVariant();
    }
    inverseSurface() {
      return _MaterialDynamicColors.colorSpec.inverseSurface();
    }
    inverseOnSurface() {
      return _MaterialDynamicColors.colorSpec.inverseOnSurface();
    }
    shadow() {
      return _MaterialDynamicColors.colorSpec.shadow();
    }
    scrim() {
      return _MaterialDynamicColors.colorSpec.scrim();
    }
    surfaceTint() {
      return _MaterialDynamicColors.colorSpec.surfaceTint();
    }
    ////////////////////////////////////////////////////////////////
    // Primaries [P]                                              //
    ////////////////////////////////////////////////////////////////
    primary() {
      return _MaterialDynamicColors.colorSpec.primary();
    }
    primaryDim() {
      return _MaterialDynamicColors.colorSpec.primaryDim();
    }
    onPrimary() {
      return _MaterialDynamicColors.colorSpec.onPrimary();
    }
    primaryContainer() {
      return _MaterialDynamicColors.colorSpec.primaryContainer();
    }
    onPrimaryContainer() {
      return _MaterialDynamicColors.colorSpec.onPrimaryContainer();
    }
    inversePrimary() {
      return _MaterialDynamicColors.colorSpec.inversePrimary();
    }
    /////////////////////////////////////////////////////////////////
    // Primary Fixed [PF]                                          //
    /////////////////////////////////////////////////////////////////
    primaryFixed() {
      return _MaterialDynamicColors.colorSpec.primaryFixed();
    }
    primaryFixedDim() {
      return _MaterialDynamicColors.colorSpec.primaryFixedDim();
    }
    onPrimaryFixed() {
      return _MaterialDynamicColors.colorSpec.onPrimaryFixed();
    }
    onPrimaryFixedVariant() {
      return _MaterialDynamicColors.colorSpec.onPrimaryFixedVariant();
    }
    ////////////////////////////////////////////////////////////////
    // Secondaries [Q]                                            //
    ////////////////////////////////////////////////////////////////
    secondary() {
      return _MaterialDynamicColors.colorSpec.secondary();
    }
    secondaryDim() {
      return _MaterialDynamicColors.colorSpec.secondaryDim();
    }
    onSecondary() {
      return _MaterialDynamicColors.colorSpec.onSecondary();
    }
    secondaryContainer() {
      return _MaterialDynamicColors.colorSpec.secondaryContainer();
    }
    onSecondaryContainer() {
      return _MaterialDynamicColors.colorSpec.onSecondaryContainer();
    }
    /////////////////////////////////////////////////////////////////
    // Secondary Fixed [QF]                                        //
    /////////////////////////////////////////////////////////////////
    secondaryFixed() {
      return _MaterialDynamicColors.colorSpec.secondaryFixed();
    }
    secondaryFixedDim() {
      return _MaterialDynamicColors.colorSpec.secondaryFixedDim();
    }
    onSecondaryFixed() {
      return _MaterialDynamicColors.colorSpec.onSecondaryFixed();
    }
    onSecondaryFixedVariant() {
      return _MaterialDynamicColors.colorSpec.onSecondaryFixedVariant();
    }
    ////////////////////////////////////////////////////////////////
    // Tertiaries [T]                                             //
    ////////////////////////////////////////////////////////////////
    tertiary() {
      return _MaterialDynamicColors.colorSpec.tertiary();
    }
    tertiaryDim() {
      return _MaterialDynamicColors.colorSpec.tertiaryDim();
    }
    onTertiary() {
      return _MaterialDynamicColors.colorSpec.onTertiary();
    }
    tertiaryContainer() {
      return _MaterialDynamicColors.colorSpec.tertiaryContainer();
    }
    onTertiaryContainer() {
      return _MaterialDynamicColors.colorSpec.onTertiaryContainer();
    }
    /////////////////////////////////////////////////////////////////
    // Tertiary Fixed [TF]                                         //
    /////////////////////////////////////////////////////////////////
    tertiaryFixed() {
      return _MaterialDynamicColors.colorSpec.tertiaryFixed();
    }
    tertiaryFixedDim() {
      return _MaterialDynamicColors.colorSpec.tertiaryFixedDim();
    }
    onTertiaryFixed() {
      return _MaterialDynamicColors.colorSpec.onTertiaryFixed();
    }
    onTertiaryFixedVariant() {
      return _MaterialDynamicColors.colorSpec.onTertiaryFixedVariant();
    }
    ////////////////////////////////////////////////////////////////
    // Errors [E]                                                 //
    ////////////////////////////////////////////////////////////////
    error() {
      return _MaterialDynamicColors.colorSpec.error();
    }
    errorDim() {
      return _MaterialDynamicColors.colorSpec.errorDim();
    }
    onError() {
      return _MaterialDynamicColors.colorSpec.onError();
    }
    errorContainer() {
      return _MaterialDynamicColors.colorSpec.errorContainer();
    }
    onErrorContainer() {
      return _MaterialDynamicColors.colorSpec.onErrorContainer();
    }
    // Static variables are deprecated. Use the instance methods to get correct
    // specs based on request.
    /** @deprecated Use highestSurface() instead. */
    static highestSurface(s) {
      return _MaterialDynamicColors.colorSpec.highestSurface(s);
    }
  };
  MaterialDynamicColors.contentAccentToneDelta = 15;
  MaterialDynamicColors.colorSpec = new ColorSpecDelegateImpl2025();
  MaterialDynamicColors.primaryPaletteKeyColor = MaterialDynamicColors.colorSpec.primaryPaletteKeyColor();
  MaterialDynamicColors.secondaryPaletteKeyColor = MaterialDynamicColors.colorSpec.secondaryPaletteKeyColor();
  MaterialDynamicColors.tertiaryPaletteKeyColor = MaterialDynamicColors.colorSpec.tertiaryPaletteKeyColor();
  MaterialDynamicColors.neutralPaletteKeyColor = MaterialDynamicColors.colorSpec.neutralPaletteKeyColor();
  MaterialDynamicColors.neutralVariantPaletteKeyColor = MaterialDynamicColors.colorSpec.neutralVariantPaletteKeyColor();
  MaterialDynamicColors.background = MaterialDynamicColors.colorSpec.background();
  MaterialDynamicColors.onBackground = MaterialDynamicColors.colorSpec.onBackground();
  MaterialDynamicColors.surface = MaterialDynamicColors.colorSpec.surface();
  MaterialDynamicColors.surfaceDim = MaterialDynamicColors.colorSpec.surfaceDim();
  MaterialDynamicColors.surfaceBright = MaterialDynamicColors.colorSpec.surfaceBright();
  MaterialDynamicColors.surfaceContainerLowest = MaterialDynamicColors.colorSpec.surfaceContainerLowest();
  MaterialDynamicColors.surfaceContainerLow = MaterialDynamicColors.colorSpec.surfaceContainerLow();
  MaterialDynamicColors.surfaceContainer = MaterialDynamicColors.colorSpec.surfaceContainer();
  MaterialDynamicColors.surfaceContainerHigh = MaterialDynamicColors.colorSpec.surfaceContainerHigh();
  MaterialDynamicColors.surfaceContainerHighest = MaterialDynamicColors.colorSpec.surfaceContainerHighest();
  MaterialDynamicColors.onSurface = MaterialDynamicColors.colorSpec.onSurface();
  MaterialDynamicColors.surfaceVariant = MaterialDynamicColors.colorSpec.surfaceVariant();
  MaterialDynamicColors.onSurfaceVariant = MaterialDynamicColors.colorSpec.onSurfaceVariant();
  MaterialDynamicColors.inverseSurface = MaterialDynamicColors.colorSpec.inverseSurface();
  MaterialDynamicColors.inverseOnSurface = MaterialDynamicColors.colorSpec.inverseOnSurface();
  MaterialDynamicColors.outline = MaterialDynamicColors.colorSpec.outline();
  MaterialDynamicColors.outlineVariant = MaterialDynamicColors.colorSpec.outlineVariant();
  MaterialDynamicColors.shadow = MaterialDynamicColors.colorSpec.shadow();
  MaterialDynamicColors.scrim = MaterialDynamicColors.colorSpec.scrim();
  MaterialDynamicColors.surfaceTint = MaterialDynamicColors.colorSpec.surfaceTint();
  MaterialDynamicColors.primary = MaterialDynamicColors.colorSpec.primary();
  MaterialDynamicColors.onPrimary = MaterialDynamicColors.colorSpec.onPrimary();
  MaterialDynamicColors.primaryContainer = MaterialDynamicColors.colorSpec.primaryContainer();
  MaterialDynamicColors.onPrimaryContainer = MaterialDynamicColors.colorSpec.onPrimaryContainer();
  MaterialDynamicColors.inversePrimary = MaterialDynamicColors.colorSpec.inversePrimary();
  MaterialDynamicColors.secondary = MaterialDynamicColors.colorSpec.secondary();
  MaterialDynamicColors.onSecondary = MaterialDynamicColors.colorSpec.onSecondary();
  MaterialDynamicColors.secondaryContainer = MaterialDynamicColors.colorSpec.secondaryContainer();
  MaterialDynamicColors.onSecondaryContainer = MaterialDynamicColors.colorSpec.onSecondaryContainer();
  MaterialDynamicColors.tertiary = MaterialDynamicColors.colorSpec.tertiary();
  MaterialDynamicColors.onTertiary = MaterialDynamicColors.colorSpec.onTertiary();
  MaterialDynamicColors.tertiaryContainer = MaterialDynamicColors.colorSpec.tertiaryContainer();
  MaterialDynamicColors.onTertiaryContainer = MaterialDynamicColors.colorSpec.onTertiaryContainer();
  MaterialDynamicColors.error = MaterialDynamicColors.colorSpec.error();
  MaterialDynamicColors.onError = MaterialDynamicColors.colorSpec.onError();
  MaterialDynamicColors.errorContainer = MaterialDynamicColors.colorSpec.errorContainer();
  MaterialDynamicColors.onErrorContainer = MaterialDynamicColors.colorSpec.onErrorContainer();
  MaterialDynamicColors.primaryFixed = MaterialDynamicColors.colorSpec.primaryFixed();
  MaterialDynamicColors.primaryFixedDim = MaterialDynamicColors.colorSpec.primaryFixedDim();
  MaterialDynamicColors.onPrimaryFixed = MaterialDynamicColors.colorSpec.onPrimaryFixed();
  MaterialDynamicColors.onPrimaryFixedVariant = MaterialDynamicColors.colorSpec.onPrimaryFixedVariant();
  MaterialDynamicColors.secondaryFixed = MaterialDynamicColors.colorSpec.secondaryFixed();
  MaterialDynamicColors.secondaryFixedDim = MaterialDynamicColors.colorSpec.secondaryFixedDim();
  MaterialDynamicColors.onSecondaryFixed = MaterialDynamicColors.colorSpec.onSecondaryFixed();
  MaterialDynamicColors.onSecondaryFixedVariant = MaterialDynamicColors.colorSpec.onSecondaryFixedVariant();
  MaterialDynamicColors.tertiaryFixed = MaterialDynamicColors.colorSpec.tertiaryFixed();
  MaterialDynamicColors.tertiaryFixedDim = MaterialDynamicColors.colorSpec.tertiaryFixedDim();
  MaterialDynamicColors.onTertiaryFixed = MaterialDynamicColors.colorSpec.onTertiaryFixed();
  MaterialDynamicColors.onTertiaryFixedVariant = MaterialDynamicColors.colorSpec.onTertiaryFixedVariant();

  // dynamiccolor/dynamic_scheme.js
  var DynamicScheme = class _DynamicScheme {
    constructor(args) {
      this.sourceColorArgb = args.sourceColorHct.toInt();
      this.variant = args.variant;
      this.contrastLevel = args.contrastLevel;
      this.isDark = args.isDark;
      this.platform = args.platform ?? "phone";
      this.specVersion = args.specVersion ?? "2021";
      this.sourceColorHct = args.sourceColorHct;
      this.primaryPalette = args.primaryPalette ?? getSpec3(this.specVersion).getPrimaryPalette(this.variant, args.sourceColorHct, this.isDark, this.platform, this.contrastLevel);
      this.secondaryPalette = args.secondaryPalette ?? getSpec3(this.specVersion).getSecondaryPalette(this.variant, args.sourceColorHct, this.isDark, this.platform, this.contrastLevel);
      this.tertiaryPalette = args.tertiaryPalette ?? getSpec3(this.specVersion).getTertiaryPalette(this.variant, args.sourceColorHct, this.isDark, this.platform, this.contrastLevel);
      this.neutralPalette = args.neutralPalette ?? getSpec3(this.specVersion).getNeutralPalette(this.variant, args.sourceColorHct, this.isDark, this.platform, this.contrastLevel);
      this.neutralVariantPalette = args.neutralVariantPalette ?? getSpec3(this.specVersion).getNeutralVariantPalette(this.variant, args.sourceColorHct, this.isDark, this.platform, this.contrastLevel);
      this.errorPalette = args.errorPalette ?? getSpec3(this.specVersion).getErrorPalette(this.variant, args.sourceColorHct, this.isDark, this.platform, this.contrastLevel) ?? TonalPalette.fromHueAndChroma(25, 84);
      this.colors = new MaterialDynamicColors();
    }
    toString() {
      return `Scheme: variant=${Variant[this.variant]}, mode=${this.isDark ? "dark" : "light"}, platform=${this.platform}, contrastLevel=${this.contrastLevel.toFixed(1)}, seed=${this.sourceColorHct.toString()}, specVersion=${this.specVersion}`;
    }
    /**
     * Returns a new hue based on a piecewise function and input color hue.
     *
     * For example, for the following function:
     * result = 26 if 0 <= hue < 101
     * result = 39 if 101 <= hue < 210
     * result = 28 if 210 <= hue < 360
     *
     * call the function as:
     *
     * const hueBreakpoints = [0, 101, 210, 360];
     * const hues = [26, 39, 28];
     * const result = scheme.piecewise(hue, hueBreakpoints, hues);
     *
     * @param sourceColorHct The input value.
     * @param hueBreakpoints The breakpoints, in sorted order. No default lower or
     *     upper bounds are assumed.
     * @param hues The hues that should be applied when source color's hue is >=
     *     the same index in hueBrakpoints array, and < the hue at the next index
     *     in hueBrakpoints array. Otherwise, the source color's hue is returned.
     */
    static getPiecewiseHue(sourceColorHct, hueBreakpoints, hues) {
      const size = Math.min(hueBreakpoints.length - 1, hues.length);
      const sourceHue = sourceColorHct.hue;
      for (let i = 0; i < size; i++) {
        if (sourceHue >= hueBreakpoints[i] && sourceHue < hueBreakpoints[i + 1]) {
          return sanitizeDegreesDouble(hues[i]);
        }
      }
      return sourceHue;
    }
    /**
     * Returns a shifted hue based on a piecewise function and input color hue.
     *
     * For example, for the following function:
     * result = hue + 26 if 0 <= hue < 101
     * result = hue - 39 if 101 <= hue < 210
     * result = hue + 28 if 210 <= hue < 360
     *
     * call the function as:
     *
     * const hueBreakpoints = [0, 101, 210, 360];
     * const hues = [26, -39, 28];
     * const result = scheme.getRotatedHue(hue, hueBreakpoints, hues);
     *
     * @param sourceColorHct the source color of the theme, in HCT.
     * @param hueBreakpoints The "breakpoints", i.e. the hues at which a rotation
     *     should be apply. No default lower or upper bounds are assumed.
     * @param rotations The rotation that should be applied when source color's
     *     hue is >= the same index in hues array, and < the hue at the next
     *     index in hues array. Otherwise, the source color's hue is returned.
     */
    static getRotatedHue(sourceColorHct, hueBreakpoints, rotations) {
      let rotation = _DynamicScheme.getPiecewiseHue(sourceColorHct, hueBreakpoints, rotations);
      if (Math.min(hueBreakpoints.length - 1, rotations.length) <= 0) {
        rotation = 0;
      }
      return sanitizeDegreesDouble(sourceColorHct.hue + rotation);
    }
    getArgb(dynamicColor) {
      return dynamicColor.getArgb(this);
    }
    getHct(dynamicColor) {
      return dynamicColor.getHct(this);
    }
    // Palette key colors
    get primaryPaletteKeyColor() {
      return this.getArgb(this.colors.primaryPaletteKeyColor());
    }
    get secondaryPaletteKeyColor() {
      return this.getArgb(this.colors.secondaryPaletteKeyColor());
    }
    get tertiaryPaletteKeyColor() {
      return this.getArgb(this.colors.tertiaryPaletteKeyColor());
    }
    get neutralPaletteKeyColor() {
      return this.getArgb(this.colors.neutralPaletteKeyColor());
    }
    get neutralVariantPaletteKeyColor() {
      return this.getArgb(this.colors.neutralVariantPaletteKeyColor());
    }
    get errorPaletteKeyColor() {
      return this.getArgb(this.colors.errorPaletteKeyColor());
    }
    // Surface colors
    get background() {
      return this.getArgb(this.colors.background());
    }
    get onBackground() {
      return this.getArgb(this.colors.onBackground());
    }
    get surface() {
      return this.getArgb(this.colors.surface());
    }
    get surfaceDim() {
      return this.getArgb(this.colors.surfaceDim());
    }
    get surfaceBright() {
      return this.getArgb(this.colors.surfaceBright());
    }
    get surfaceContainerLowest() {
      return this.getArgb(this.colors.surfaceContainerLowest());
    }
    get surfaceContainerLow() {
      return this.getArgb(this.colors.surfaceContainerLow());
    }
    get surfaceContainer() {
      return this.getArgb(this.colors.surfaceContainer());
    }
    get surfaceContainerHigh() {
      return this.getArgb(this.colors.surfaceContainerHigh());
    }
    get surfaceContainerHighest() {
      return this.getArgb(this.colors.surfaceContainerHighest());
    }
    get onSurface() {
      return this.getArgb(this.colors.onSurface());
    }
    get surfaceVariant() {
      return this.getArgb(this.colors.surfaceVariant());
    }
    get onSurfaceVariant() {
      return this.getArgb(this.colors.onSurfaceVariant());
    }
    get inverseSurface() {
      return this.getArgb(this.colors.inverseSurface());
    }
    get inverseOnSurface() {
      return this.getArgb(this.colors.inverseOnSurface());
    }
    get outline() {
      return this.getArgb(this.colors.outline());
    }
    get outlineVariant() {
      return this.getArgb(this.colors.outlineVariant());
    }
    get shadow() {
      return this.getArgb(this.colors.shadow());
    }
    get scrim() {
      return this.getArgb(this.colors.scrim());
    }
    get surfaceTint() {
      return this.getArgb(this.colors.surfaceTint());
    }
    // Primary colors
    get primary() {
      return this.getArgb(this.colors.primary());
    }
    get primaryDim() {
      const primaryDim = this.colors.primaryDim();
      if (primaryDim === void 0) {
        throw new Error("`primaryDim` color is undefined prior to 2025 spec.");
      }
      return this.getArgb(primaryDim);
    }
    get onPrimary() {
      return this.getArgb(this.colors.onPrimary());
    }
    get primaryContainer() {
      return this.getArgb(this.colors.primaryContainer());
    }
    get onPrimaryContainer() {
      return this.getArgb(this.colors.onPrimaryContainer());
    }
    get primaryFixed() {
      return this.getArgb(this.colors.primaryFixed());
    }
    get primaryFixedDim() {
      return this.getArgb(this.colors.primaryFixedDim());
    }
    get onPrimaryFixed() {
      return this.getArgb(this.colors.onPrimaryFixed());
    }
    get onPrimaryFixedVariant() {
      return this.getArgb(this.colors.onPrimaryFixedVariant());
    }
    get inversePrimary() {
      return this.getArgb(this.colors.inversePrimary());
    }
    // Secondary colors
    get secondary() {
      return this.getArgb(this.colors.secondary());
    }
    get secondaryDim() {
      const secondaryDim = this.colors.secondaryDim();
      if (secondaryDim === void 0) {
        throw new Error("`secondaryDim` color is undefined prior to 2025 spec.");
      }
      return this.getArgb(secondaryDim);
    }
    get onSecondary() {
      return this.getArgb(this.colors.onSecondary());
    }
    get secondaryContainer() {
      return this.getArgb(this.colors.secondaryContainer());
    }
    get onSecondaryContainer() {
      return this.getArgb(this.colors.onSecondaryContainer());
    }
    get secondaryFixed() {
      return this.getArgb(this.colors.secondaryFixed());
    }
    get secondaryFixedDim() {
      return this.getArgb(this.colors.secondaryFixedDim());
    }
    get onSecondaryFixed() {
      return this.getArgb(this.colors.onSecondaryFixed());
    }
    get onSecondaryFixedVariant() {
      return this.getArgb(this.colors.onSecondaryFixedVariant());
    }
    // Tertiary colors
    get tertiary() {
      return this.getArgb(this.colors.tertiary());
    }
    get tertiaryDim() {
      const tertiaryDim = this.colors.tertiaryDim();
      if (tertiaryDim === void 0) {
        throw new Error("`tertiaryDim` color is undefined prior to 2025 spec.");
      }
      return this.getArgb(tertiaryDim);
    }
    get onTertiary() {
      return this.getArgb(this.colors.onTertiary());
    }
    get tertiaryContainer() {
      return this.getArgb(this.colors.tertiaryContainer());
    }
    get onTertiaryContainer() {
      return this.getArgb(this.colors.onTertiaryContainer());
    }
    get tertiaryFixed() {
      return this.getArgb(this.colors.tertiaryFixed());
    }
    get tertiaryFixedDim() {
      return this.getArgb(this.colors.tertiaryFixedDim());
    }
    get onTertiaryFixed() {
      return this.getArgb(this.colors.onTertiaryFixed());
    }
    get onTertiaryFixedVariant() {
      return this.getArgb(this.colors.onTertiaryFixedVariant());
    }
    // Error colors
    get error() {
      return this.getArgb(this.colors.error());
    }
    get errorDim() {
      const errorDim = this.colors.errorDim();
      if (errorDim === void 0) {
        throw new Error("`errorDim` color is undefined prior to 2025 spec.");
      }
      return this.getArgb(errorDim);
    }
    get onError() {
      return this.getArgb(this.colors.onError());
    }
    get errorContainer() {
      return this.getArgb(this.colors.errorContainer());
    }
    get onErrorContainer() {
      return this.getArgb(this.colors.onErrorContainer());
    }
  };
  var DynamicSchemePalettesDelegateImpl2021 = class {
    //////////////////////////////////////////////////////////////////
    // Scheme Palettes                                              //
    //////////////////////////////////////////////////////////////////
    getPrimaryPalette(variant, sourceColorHct, isDark, platform, contrastLevel) {
      switch (variant) {
        case Variant.CONTENT:
        case Variant.FIDELITY:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, sourceColorHct.chroma);
        case Variant.FRUIT_SALAD:
          return TonalPalette.fromHueAndChroma(sanitizeDegreesDouble(sourceColorHct.hue - 50), 48);
        case Variant.MONOCHROME:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 0);
        case Variant.NEUTRAL:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 12);
        case Variant.RAINBOW:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 48);
        case Variant.TONAL_SPOT:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 36);
        case Variant.EXPRESSIVE:
          return TonalPalette.fromHueAndChroma(sanitizeDegreesDouble(sourceColorHct.hue + 240), 40);
        case Variant.VIBRANT:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 200);
        default:
          throw new Error(`Unsupported variant: ${variant}`);
      }
    }
    getSecondaryPalette(variant, sourceColorHct, isDark, platform, contrastLevel) {
      switch (variant) {
        case Variant.CONTENT:
        case Variant.FIDELITY:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, Math.max(sourceColorHct.chroma - 32, sourceColorHct.chroma * 0.5));
        case Variant.FRUIT_SALAD:
          return TonalPalette.fromHueAndChroma(sanitizeDegreesDouble(sourceColorHct.hue - 50), 36);
        case Variant.MONOCHROME:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 0);
        case Variant.NEUTRAL:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 8);
        case Variant.RAINBOW:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 16);
        case Variant.TONAL_SPOT:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 16);
        case Variant.EXPRESSIVE:
          return TonalPalette.fromHueAndChroma(DynamicScheme.getRotatedHue(sourceColorHct, [0, 21, 51, 121, 151, 191, 271, 321, 360], [45, 95, 45, 20, 45, 90, 45, 45, 45]), 24);
        case Variant.VIBRANT:
          return TonalPalette.fromHueAndChroma(DynamicScheme.getRotatedHue(sourceColorHct, [0, 41, 61, 101, 131, 181, 251, 301, 360], [18, 15, 10, 12, 15, 18, 15, 12, 12]), 24);
        default:
          throw new Error(`Unsupported variant: ${variant}`);
      }
    }
    getTertiaryPalette(variant, sourceColorHct, isDark, platform, contrastLevel) {
      switch (variant) {
        case Variant.CONTENT:
          return TonalPalette.fromHct(DislikeAnalyzer.fixIfDisliked(new TemperatureCache(sourceColorHct).analogous(
            /* count= */
            3,
            /* divisions= */
            6
          )[2]));
        case Variant.FIDELITY:
          return TonalPalette.fromHct(DislikeAnalyzer.fixIfDisliked(new TemperatureCache(sourceColorHct).complement));
        case Variant.FRUIT_SALAD:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 36);
        case Variant.MONOCHROME:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 0);
        case Variant.NEUTRAL:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 16);
        case Variant.RAINBOW:
        case Variant.TONAL_SPOT:
          return TonalPalette.fromHueAndChroma(sanitizeDegreesDouble(sourceColorHct.hue + 60), 24);
        case Variant.EXPRESSIVE:
          return TonalPalette.fromHueAndChroma(DynamicScheme.getRotatedHue(sourceColorHct, [0, 21, 51, 121, 151, 191, 271, 321, 360], [120, 120, 20, 45, 20, 15, 20, 120, 120]), 32);
        case Variant.VIBRANT:
          return TonalPalette.fromHueAndChroma(DynamicScheme.getRotatedHue(sourceColorHct, [0, 41, 61, 101, 131, 181, 251, 301, 360], [35, 30, 20, 25, 30, 35, 30, 25, 25]), 32);
        default:
          throw new Error(`Unsupported variant: ${variant}`);
      }
    }
    getNeutralPalette(variant, sourceColorHct, isDark, platform, contrastLevel) {
      switch (variant) {
        case Variant.CONTENT:
        case Variant.FIDELITY:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, sourceColorHct.chroma / 8);
        case Variant.FRUIT_SALAD:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 10);
        case Variant.MONOCHROME:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 0);
        case Variant.NEUTRAL:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 2);
        case Variant.RAINBOW:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 0);
        case Variant.TONAL_SPOT:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 6);
        case Variant.EXPRESSIVE:
          return TonalPalette.fromHueAndChroma(sanitizeDegreesDouble(sourceColorHct.hue + 15), 8);
        case Variant.VIBRANT:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 10);
        default:
          throw new Error(`Unsupported variant: ${variant}`);
      }
    }
    getNeutralVariantPalette(variant, sourceColorHct, isDark, platform, contrastLevel) {
      switch (variant) {
        case Variant.CONTENT:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, sourceColorHct.chroma / 8 + 4);
        case Variant.FIDELITY:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, sourceColorHct.chroma / 8 + 4);
        case Variant.FRUIT_SALAD:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 16);
        case Variant.MONOCHROME:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 0);
        case Variant.NEUTRAL:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 2);
        case Variant.RAINBOW:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 0);
        case Variant.TONAL_SPOT:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 8);
        case Variant.EXPRESSIVE:
          return TonalPalette.fromHueAndChroma(sanitizeDegreesDouble(sourceColorHct.hue + 15), 12);
        case Variant.VIBRANT:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 12);
        default:
          throw new Error(`Unsupported variant: ${variant}`);
      }
    }
    getErrorPalette(variant, sourceColorHct, isDark, platform, contrastLevel) {
      return void 0;
    }
  };
  var DynamicSchemePalettesDelegateImpl2025 = class _DynamicSchemePalettesDelegateImpl2025 extends DynamicSchemePalettesDelegateImpl2021 {
    //////////////////////////////////////////////////////////////////
    // Scheme Palettes                                              //
    //////////////////////////////////////////////////////////////////
    getPrimaryPalette(variant, sourceColorHct, isDark, platform, contrastLevel) {
      switch (variant) {
        case Variant.NEUTRAL:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, platform === "phone" ? sourceColorHct.isBlue() ? 12 : 8 : sourceColorHct.isBlue() ? 16 : 12);
        case Variant.TONAL_SPOT:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, platform === "phone" && isDark ? 26 : 32);
        case Variant.EXPRESSIVE:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, platform === "phone" ? isDark ? 36 : 48 : 40);
        case Variant.VIBRANT:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, platform === "phone" ? 74 : 56);
        default:
          return super.getPrimaryPalette(variant, sourceColorHct, isDark, platform, contrastLevel);
      }
    }
    getSecondaryPalette(variant, sourceColorHct, isDark, platform, contrastLevel) {
      switch (variant) {
        case Variant.NEUTRAL:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, platform === "phone" ? sourceColorHct.isBlue() ? 6 : 4 : sourceColorHct.isBlue() ? 10 : 6);
        case Variant.TONAL_SPOT:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 16);
        case Variant.EXPRESSIVE:
          return TonalPalette.fromHueAndChroma(DynamicScheme.getRotatedHue(sourceColorHct, [0, 105, 140, 204, 253, 278, 300, 333, 360], [-160, 155, -100, 96, -96, -156, -165, -160]), platform === "phone" ? isDark ? 16 : 24 : 24);
        case Variant.VIBRANT:
          return TonalPalette.fromHueAndChroma(DynamicScheme.getRotatedHue(sourceColorHct, [0, 38, 105, 140, 333, 360], [-14, 10, -14, 10, -14]), platform === "phone" ? 56 : 36);
        default:
          return super.getSecondaryPalette(variant, sourceColorHct, isDark, platform, contrastLevel);
      }
    }
    getTertiaryPalette(variant, sourceColorHct, isDark, platform, contrastLevel) {
      switch (variant) {
        case Variant.NEUTRAL:
          return TonalPalette.fromHueAndChroma(DynamicScheme.getRotatedHue(sourceColorHct, [0, 38, 105, 161, 204, 278, 333, 360], [-32, 26, 10, -39, 24, -15, -32]), platform === "phone" ? 20 : 36);
        case Variant.TONAL_SPOT:
          return TonalPalette.fromHueAndChroma(DynamicScheme.getRotatedHue(sourceColorHct, [0, 20, 71, 161, 333, 360], [-40, 48, -32, 40, -32]), platform === "phone" ? 28 : 32);
        case Variant.EXPRESSIVE:
          return TonalPalette.fromHueAndChroma(DynamicScheme.getRotatedHue(sourceColorHct, [0, 105, 140, 204, 253, 278, 300, 333, 360], [-165, 160, -105, 101, -101, -160, -170, -165]), 48);
        case Variant.VIBRANT:
          return TonalPalette.fromHueAndChroma(DynamicScheme.getRotatedHue(sourceColorHct, [0, 38, 71, 105, 140, 161, 253, 333, 360], [-72, 35, 24, -24, 62, 50, 62, -72]), 56);
        default:
          return super.getTertiaryPalette(variant, sourceColorHct, isDark, platform, contrastLevel);
      }
    }
    static getExpressiveNeutralHue(sourceColorHct) {
      return DynamicScheme.getRotatedHue(sourceColorHct, [0, 71, 124, 253, 278, 300, 360], [10, 0, 10, 0, 10, 0]);
    }
    static getExpressiveNeutralChroma(sourceColorHct, isDark, platform) {
      const neutralHue = _DynamicSchemePalettesDelegateImpl2025.getExpressiveNeutralHue(sourceColorHct);
      const neutralHueIsYellow = neutralHue >= 105 && neutralHue < 125;
      return platform === "phone" ? isDark ? neutralHueIsYellow ? 6 : 14 : 18 : 12;
    }
    static getVibrantNeutralHue(sourceColorHct) {
      return DynamicScheme.getRotatedHue(sourceColorHct, [0, 38, 105, 140, 333, 360], [-14, 10, -14, 10, -14]);
    }
    static getVibrantNeutralChroma(sourceColorHct, platform) {
      const neutralHue = _DynamicSchemePalettesDelegateImpl2025.getVibrantNeutralHue(sourceColorHct);
      const neutralHueIsBlue = neutralHue >= 250 && neutralHue < 270;
      return platform === "phone" ? 28 : neutralHueIsBlue ? 28 : 20;
    }
    getNeutralPalette(variant, sourceColorHct, isDark, platform, contrastLevel) {
      switch (variant) {
        case Variant.NEUTRAL:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, platform === "phone" ? 1.4 : 6);
        case Variant.TONAL_SPOT:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, platform === "phone" ? 5 : 10);
        case Variant.EXPRESSIVE:
          return TonalPalette.fromHueAndChroma(_DynamicSchemePalettesDelegateImpl2025.getExpressiveNeutralHue(sourceColorHct), _DynamicSchemePalettesDelegateImpl2025.getExpressiveNeutralChroma(sourceColorHct, isDark, platform));
        case Variant.VIBRANT:
          return TonalPalette.fromHueAndChroma(_DynamicSchemePalettesDelegateImpl2025.getVibrantNeutralHue(sourceColorHct), _DynamicSchemePalettesDelegateImpl2025.getVibrantNeutralChroma(sourceColorHct, platform));
        default:
          return super.getNeutralPalette(variant, sourceColorHct, isDark, platform, contrastLevel);
      }
    }
    getNeutralVariantPalette(variant, sourceColorHct, isDark, platform, contrastLevel) {
      switch (variant) {
        case Variant.NEUTRAL:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, (platform === "phone" ? 1.4 : 6) * 2.2);
        case Variant.TONAL_SPOT:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, (platform === "phone" ? 5 : 10) * 1.7);
        case Variant.EXPRESSIVE:
          const expressiveNeutralHue = _DynamicSchemePalettesDelegateImpl2025.getExpressiveNeutralHue(sourceColorHct);
          const expressiveNeutralChroma = _DynamicSchemePalettesDelegateImpl2025.getExpressiveNeutralChroma(sourceColorHct, isDark, platform);
          return TonalPalette.fromHueAndChroma(expressiveNeutralHue, expressiveNeutralChroma * (expressiveNeutralHue >= 105 && expressiveNeutralHue < 125 ? 1.6 : 2.3));
        case Variant.VIBRANT:
          const vibrantNeutralHue = _DynamicSchemePalettesDelegateImpl2025.getVibrantNeutralHue(sourceColorHct);
          const vibrantNeutralChroma = _DynamicSchemePalettesDelegateImpl2025.getVibrantNeutralChroma(sourceColorHct, platform);
          return TonalPalette.fromHueAndChroma(vibrantNeutralHue, vibrantNeutralChroma * 1.29);
        default:
          return super.getNeutralVariantPalette(variant, sourceColorHct, isDark, platform, contrastLevel);
      }
    }
    getErrorPalette(variant, sourceColorHct, isDark, platform, contrastLevel) {
      const errorHue = DynamicScheme.getPiecewiseHue(sourceColorHct, [0, 3, 13, 23, 33, 43, 153, 273, 360], [12, 22, 32, 12, 22, 32, 22, 12]);
      switch (variant) {
        case Variant.NEUTRAL:
          return TonalPalette.fromHueAndChroma(errorHue, platform === "phone" ? 50 : 40);
        case Variant.TONAL_SPOT:
          return TonalPalette.fromHueAndChroma(errorHue, platform === "phone" ? 60 : 48);
        case Variant.EXPRESSIVE:
          return TonalPalette.fromHueAndChroma(errorHue, platform === "phone" ? 64 : 48);
        case Variant.VIBRANT:
          return TonalPalette.fromHueAndChroma(errorHue, platform === "phone" ? 80 : 60);
        default:
          return super.getErrorPalette(variant, sourceColorHct, isDark, platform, contrastLevel);
      }
    }
  };
  var spec20213 = new DynamicSchemePalettesDelegateImpl2021();
  var spec20253 = new DynamicSchemePalettesDelegateImpl2025();
  function getSpec3(specVersion) {
    return specVersion === "2025" ? spec20253 : spec20213;
  }

  // palettes/core_palette.js
  var CorePalette = class _CorePalette {
    /**
     * @param argb ARGB representation of a color
     *
     * @deprecated Use {@link DynamicScheme} for color scheme generation.
     * Use {@link CorePalettes} for core palettes container class.
     */
    static of(argb) {
      return new _CorePalette(argb, false);
    }
    /**
     * @param argb ARGB representation of a color
     *
     * @deprecated Use {@link DynamicScheme} for color scheme generation.
     * Use {@link CorePalettes} for core palettes container class.
     */
    static contentOf(argb) {
      return new _CorePalette(argb, true);
    }
    /**
     * Create a [CorePalette] from a set of colors
     *
     * @deprecated Use {@link DynamicScheme} for color scheme generation.
     * Use {@link CorePalettes} for core palettes container class.
     */
    static fromColors(colors) {
      return _CorePalette.createPaletteFromColors(false, colors);
    }
    /**
     * Create a content [CorePalette] from a set of colors
     *
     * @deprecated Use {@link DynamicScheme} for color scheme generation.
     * Use {@link CorePalettes} for core palettes container class.
     */
    static contentFromColors(colors) {
      return _CorePalette.createPaletteFromColors(true, colors);
    }
    static createPaletteFromColors(content, colors) {
      const palette = new _CorePalette(colors.primary, content);
      if (colors.secondary) {
        const p = new _CorePalette(colors.secondary, content);
        palette.a2 = p.a1;
      }
      if (colors.tertiary) {
        const p = new _CorePalette(colors.tertiary, content);
        palette.a3 = p.a1;
      }
      if (colors.error) {
        const p = new _CorePalette(colors.error, content);
        palette.error = p.a1;
      }
      if (colors.neutral) {
        const p = new _CorePalette(colors.neutral, content);
        palette.n1 = p.n1;
      }
      if (colors.neutralVariant) {
        const p = new _CorePalette(colors.neutralVariant, content);
        palette.n2 = p.n2;
      }
      return palette;
    }
    constructor(argb, isContent) {
      const hct = Hct.fromInt(argb);
      const hue = hct.hue;
      const chroma = hct.chroma;
      if (isContent) {
        this.a1 = TonalPalette.fromHueAndChroma(hue, chroma);
        this.a2 = TonalPalette.fromHueAndChroma(hue, chroma / 3);
        this.a3 = TonalPalette.fromHueAndChroma(hue + 60, chroma / 2);
        this.n1 = TonalPalette.fromHueAndChroma(hue, Math.min(chroma / 12, 4));
        this.n2 = TonalPalette.fromHueAndChroma(hue, Math.min(chroma / 6, 8));
      } else {
        this.a1 = TonalPalette.fromHueAndChroma(hue, Math.max(48, chroma));
        this.a2 = TonalPalette.fromHueAndChroma(hue, 16);
        this.a3 = TonalPalette.fromHueAndChroma(hue + 60, 24);
        this.n1 = TonalPalette.fromHueAndChroma(hue, 4);
        this.n2 = TonalPalette.fromHueAndChroma(hue, 8);
      }
      this.error = TonalPalette.fromHueAndChroma(25, 84);
    }
  };

  // quantize/lab_point_provider.js
  var LabPointProvider = class {
    /**
     * Convert a color represented in ARGB to a 3-element array of L*a*b*
     * coordinates of the color.
     */
    fromInt(argb) {
      return labFromArgb(argb);
    }
    /**
     * Convert a 3-element array to a color represented in ARGB.
     */
    toInt(point) {
      return argbFromLab(point[0], point[1], point[2]);
    }
    /**
     * Standard CIE 1976 delta E formula also takes the square root, unneeded
     * here. This method is used by quantization algorithms to compare distance,
     * and the relative ordering is the same, with or without a square root.
     *
     * This relatively minor optimization is helpful because this method is
     * called at least once for each pixel in an image.
     */
    distance(from, to) {
      const dL = from[0] - to[0];
      const dA = from[1] - to[1];
      const dB = from[2] - to[2];
      return dL * dL + dA * dA + dB * dB;
    }
  };

  // quantize/quantizer_wsmeans.js
  var MAX_ITERATIONS = 10;
  var MIN_MOVEMENT_DISTANCE = 3;
  var QuantizerWsmeans = class {
    /**
     * @param inputPixels Colors in ARGB format.
     * @param startingClusters Defines the initial state of the quantizer. Passing
     *     an empty array is fine, the implementation will create its own initial
     *     state that leads to reproducible results for the same inputs.
     *     Passing an array that is the result of Wu quantization leads to higher
     *     quality results.
     * @param maxColors The number of colors to divide the image into. A lower
     *     number of colors may be returned.
     * @return Colors in ARGB format.
     */
    static quantize(inputPixels, startingClusters, maxColors) {
      const pixelToCount = /* @__PURE__ */ new Map();
      const points = new Array();
      const pixels = new Array();
      const pointProvider = new LabPointProvider();
      let pointCount = 0;
      for (let i = 0; i < inputPixels.length; i++) {
        const inputPixel = inputPixels[i];
        const pixelCount = pixelToCount.get(inputPixel);
        if (pixelCount === void 0) {
          pointCount++;
          points.push(pointProvider.fromInt(inputPixel));
          pixels.push(inputPixel);
          pixelToCount.set(inputPixel, 1);
        } else {
          pixelToCount.set(inputPixel, pixelCount + 1);
        }
      }
      const counts = new Array();
      for (let i = 0; i < pointCount; i++) {
        const pixel = pixels[i];
        const count = pixelToCount.get(pixel);
        if (count !== void 0) {
          counts[i] = count;
        }
      }
      let clusterCount = Math.min(maxColors, pointCount);
      if (startingClusters.length > 0) {
        clusterCount = Math.min(clusterCount, startingClusters.length);
      }
      const clusters = new Array();
      for (let i = 0; i < startingClusters.length; i++) {
        clusters.push(pointProvider.fromInt(startingClusters[i]));
      }
      const additionalClustersNeeded = clusterCount - clusters.length;
      if (startingClusters.length === 0 && additionalClustersNeeded > 0) {
        for (let i = 0; i < additionalClustersNeeded; i++) {
          const l = Math.random() * 100;
          const a = Math.random() * (100 - -100 + 1) + -100;
          const b = Math.random() * (100 - -100 + 1) + -100;
          clusters.push(new Array(l, a, b));
        }
      }
      const clusterIndices = new Array();
      for (let i = 0; i < pointCount; i++) {
        clusterIndices.push(Math.floor(Math.random() * clusterCount));
      }
      const indexMatrix = new Array();
      for (let i = 0; i < clusterCount; i++) {
        indexMatrix.push(new Array());
        for (let j = 0; j < clusterCount; j++) {
          indexMatrix[i].push(0);
        }
      }
      const distanceToIndexMatrix = new Array();
      for (let i = 0; i < clusterCount; i++) {
        distanceToIndexMatrix.push(new Array());
        for (let j = 0; j < clusterCount; j++) {
          distanceToIndexMatrix[i].push(new DistanceAndIndex());
        }
      }
      const pixelCountSums = new Array();
      for (let i = 0; i < clusterCount; i++) {
        pixelCountSums.push(0);
      }
      for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
        for (let i = 0; i < clusterCount; i++) {
          for (let j = i + 1; j < clusterCount; j++) {
            const distance = pointProvider.distance(clusters[i], clusters[j]);
            distanceToIndexMatrix[j][i].distance = distance;
            distanceToIndexMatrix[j][i].index = i;
            distanceToIndexMatrix[i][j].distance = distance;
            distanceToIndexMatrix[i][j].index = j;
          }
          distanceToIndexMatrix[i].sort();
          for (let j = 0; j < clusterCount; j++) {
            indexMatrix[i][j] = distanceToIndexMatrix[i][j].index;
          }
        }
        let pointsMoved = 0;
        for (let i = 0; i < pointCount; i++) {
          const point = points[i];
          const previousClusterIndex = clusterIndices[i];
          const previousCluster = clusters[previousClusterIndex];
          const previousDistance = pointProvider.distance(point, previousCluster);
          let minimumDistance = previousDistance;
          let newClusterIndex = -1;
          for (let j = 0; j < clusterCount; j++) {
            if (distanceToIndexMatrix[previousClusterIndex][j].distance >= 4 * previousDistance) {
              continue;
            }
            const distance = pointProvider.distance(point, clusters[j]);
            if (distance < minimumDistance) {
              minimumDistance = distance;
              newClusterIndex = j;
            }
          }
          if (newClusterIndex !== -1) {
            const distanceChange = Math.abs(Math.sqrt(minimumDistance) - Math.sqrt(previousDistance));
            if (distanceChange > MIN_MOVEMENT_DISTANCE) {
              pointsMoved++;
              clusterIndices[i] = newClusterIndex;
            }
          }
        }
        if (pointsMoved === 0 && iteration !== 0) {
          break;
        }
        const componentASums = new Array(clusterCount).fill(0);
        const componentBSums = new Array(clusterCount).fill(0);
        const componentCSums = new Array(clusterCount).fill(0);
        for (let i = 0; i < clusterCount; i++) {
          pixelCountSums[i] = 0;
        }
        for (let i = 0; i < pointCount; i++) {
          const clusterIndex = clusterIndices[i];
          const point = points[i];
          const count = counts[i];
          pixelCountSums[clusterIndex] += count;
          componentASums[clusterIndex] += point[0] * count;
          componentBSums[clusterIndex] += point[1] * count;
          componentCSums[clusterIndex] += point[2] * count;
        }
        for (let i = 0; i < clusterCount; i++) {
          const count = pixelCountSums[i];
          if (count === 0) {
            clusters[i] = [0, 0, 0];
            continue;
          }
          const a = componentASums[i] / count;
          const b = componentBSums[i] / count;
          const c = componentCSums[i] / count;
          clusters[i] = [a, b, c];
        }
      }
      const argbToPopulation = /* @__PURE__ */ new Map();
      for (let i = 0; i < clusterCount; i++) {
        const count = pixelCountSums[i];
        if (count === 0) {
          continue;
        }
        const possibleNewCluster = pointProvider.toInt(clusters[i]);
        if (argbToPopulation.has(possibleNewCluster)) {
          continue;
        }
        argbToPopulation.set(possibleNewCluster, count);
      }
      return argbToPopulation;
    }
  };
  var DistanceAndIndex = class {
    constructor() {
      this.distance = -1;
      this.index = -1;
    }
  };

  // quantize/quantizer_map.js
  var QuantizerMap = class {
    /**
     * @param pixels Colors in ARGB format.
     * @return A Map with keys of ARGB colors, and values of the number of times
     *     the color appears in the image.
     */
    static quantize(pixels) {
      const countByColor = /* @__PURE__ */ new Map();
      for (let i = 0; i < pixels.length; i++) {
        const pixel = pixels[i];
        const alpha = alphaFromArgb(pixel);
        if (alpha < 255) {
          continue;
        }
        countByColor.set(pixel, (countByColor.get(pixel) ?? 0) + 1);
      }
      return countByColor;
    }
  };

  // quantize/quantizer_wu.js
  var INDEX_BITS = 5;
  var SIDE_LENGTH = 33;
  var TOTAL_SIZE = 35937;
  var directions = {
    RED: "red",
    GREEN: "green",
    BLUE: "blue"
  };
  var QuantizerWu = class {
    constructor(weights = [], momentsR = [], momentsG = [], momentsB = [], moments = [], cubes = []) {
      this.weights = weights;
      this.momentsR = momentsR;
      this.momentsG = momentsG;
      this.momentsB = momentsB;
      this.moments = moments;
      this.cubes = cubes;
    }
    /**
     * @param pixels Colors in ARGB format.
     * @param maxColors The number of colors to divide the image into. A lower
     *     number of colors may be returned.
     * @return Colors in ARGB format.
     */
    quantize(pixels, maxColors) {
      this.constructHistogram(pixels);
      this.computeMoments();
      const createBoxesResult = this.createBoxes(maxColors);
      const results = this.createResult(createBoxesResult.resultCount);
      return results;
    }
    constructHistogram(pixels) {
      this.weights = Array.from({ length: TOTAL_SIZE }).fill(0);
      this.momentsR = Array.from({ length: TOTAL_SIZE }).fill(0);
      this.momentsG = Array.from({ length: TOTAL_SIZE }).fill(0);
      this.momentsB = Array.from({ length: TOTAL_SIZE }).fill(0);
      this.moments = Array.from({ length: TOTAL_SIZE }).fill(0);
      const countByColor = QuantizerMap.quantize(pixels);
      for (const [pixel, count] of countByColor.entries()) {
        const red = redFromArgb(pixel);
        const green = greenFromArgb(pixel);
        const blue = blueFromArgb(pixel);
        const bitsToRemove = 8 - INDEX_BITS;
        const iR = (red >> bitsToRemove) + 1;
        const iG = (green >> bitsToRemove) + 1;
        const iB = (blue >> bitsToRemove) + 1;
        const index = this.getIndex(iR, iG, iB);
        this.weights[index] = (this.weights[index] ?? 0) + count;
        this.momentsR[index] += count * red;
        this.momentsG[index] += count * green;
        this.momentsB[index] += count * blue;
        this.moments[index] += count * (red * red + green * green + blue * blue);
      }
    }
    computeMoments() {
      for (let r = 1; r < SIDE_LENGTH; r++) {
        const area = Array.from({ length: SIDE_LENGTH }).fill(0);
        const areaR = Array.from({ length: SIDE_LENGTH }).fill(0);
        const areaG = Array.from({ length: SIDE_LENGTH }).fill(0);
        const areaB = Array.from({ length: SIDE_LENGTH }).fill(0);
        const area2 = Array.from({ length: SIDE_LENGTH }).fill(0);
        for (let g = 1; g < SIDE_LENGTH; g++) {
          let line = 0;
          let lineR = 0;
          let lineG = 0;
          let lineB = 0;
          let line2 = 0;
          for (let b = 1; b < SIDE_LENGTH; b++) {
            const index = this.getIndex(r, g, b);
            line += this.weights[index];
            lineR += this.momentsR[index];
            lineG += this.momentsG[index];
            lineB += this.momentsB[index];
            line2 += this.moments[index];
            area[b] += line;
            areaR[b] += lineR;
            areaG[b] += lineG;
            areaB[b] += lineB;
            area2[b] += line2;
            const previousIndex = this.getIndex(r - 1, g, b);
            this.weights[index] = this.weights[previousIndex] + area[b];
            this.momentsR[index] = this.momentsR[previousIndex] + areaR[b];
            this.momentsG[index] = this.momentsG[previousIndex] + areaG[b];
            this.momentsB[index] = this.momentsB[previousIndex] + areaB[b];
            this.moments[index] = this.moments[previousIndex] + area2[b];
          }
        }
      }
    }
    createBoxes(maxColors) {
      this.cubes = Array.from({ length: maxColors }).fill(0).map(() => new Box());
      const volumeVariance = Array.from({ length: maxColors }).fill(0);
      this.cubes[0].r0 = 0;
      this.cubes[0].g0 = 0;
      this.cubes[0].b0 = 0;
      this.cubes[0].r1 = SIDE_LENGTH - 1;
      this.cubes[0].g1 = SIDE_LENGTH - 1;
      this.cubes[0].b1 = SIDE_LENGTH - 1;
      let generatedColorCount = maxColors;
      let next = 0;
      for (let i = 1; i < maxColors; i++) {
        if (this.cut(this.cubes[next], this.cubes[i])) {
          volumeVariance[next] = this.cubes[next].vol > 1 ? this.variance(this.cubes[next]) : 0;
          volumeVariance[i] = this.cubes[i].vol > 1 ? this.variance(this.cubes[i]) : 0;
        } else {
          volumeVariance[next] = 0;
          i--;
        }
        next = 0;
        let temp = volumeVariance[0];
        for (let j = 1; j <= i; j++) {
          if (volumeVariance[j] > temp) {
            temp = volumeVariance[j];
            next = j;
          }
        }
        if (temp <= 0) {
          generatedColorCount = i + 1;
          break;
        }
      }
      return new CreateBoxesResult(maxColors, generatedColorCount);
    }
    createResult(colorCount) {
      const colors = [];
      for (let i = 0; i < colorCount; ++i) {
        const cube = this.cubes[i];
        const weight = this.volume(cube, this.weights);
        if (weight > 0) {
          const r = Math.round(this.volume(cube, this.momentsR) / weight);
          const g = Math.round(this.volume(cube, this.momentsG) / weight);
          const b = Math.round(this.volume(cube, this.momentsB) / weight);
          const color = 255 << 24 | (r & 255) << 16 | (g & 255) << 8 | b & 255;
          colors.push(color);
        }
      }
      return colors;
    }
    variance(cube) {
      const dr = this.volume(cube, this.momentsR);
      const dg = this.volume(cube, this.momentsG);
      const db = this.volume(cube, this.momentsB);
      const xx = this.moments[this.getIndex(cube.r1, cube.g1, cube.b1)] - this.moments[this.getIndex(cube.r1, cube.g1, cube.b0)] - this.moments[this.getIndex(cube.r1, cube.g0, cube.b1)] + this.moments[this.getIndex(cube.r1, cube.g0, cube.b0)] - this.moments[this.getIndex(cube.r0, cube.g1, cube.b1)] + this.moments[this.getIndex(cube.r0, cube.g1, cube.b0)] + this.moments[this.getIndex(cube.r0, cube.g0, cube.b1)] - this.moments[this.getIndex(cube.r0, cube.g0, cube.b0)];
      const hypotenuse = dr * dr + dg * dg + db * db;
      const volume = this.volume(cube, this.weights);
      return xx - hypotenuse / volume;
    }
    cut(one, two) {
      const wholeR = this.volume(one, this.momentsR);
      const wholeG = this.volume(one, this.momentsG);
      const wholeB = this.volume(one, this.momentsB);
      const wholeW = this.volume(one, this.weights);
      const maxRResult = this.maximize(one, directions.RED, one.r0 + 1, one.r1, wholeR, wholeG, wholeB, wholeW);
      const maxGResult = this.maximize(one, directions.GREEN, one.g0 + 1, one.g1, wholeR, wholeG, wholeB, wholeW);
      const maxBResult = this.maximize(one, directions.BLUE, one.b0 + 1, one.b1, wholeR, wholeG, wholeB, wholeW);
      let direction;
      const maxR = maxRResult.maximum;
      const maxG = maxGResult.maximum;
      const maxB = maxBResult.maximum;
      if (maxR >= maxG && maxR >= maxB) {
        if (maxRResult.cutLocation < 0) {
          return false;
        }
        direction = directions.RED;
      } else if (maxG >= maxR && maxG >= maxB) {
        direction = directions.GREEN;
      } else {
        direction = directions.BLUE;
      }
      two.r1 = one.r1;
      two.g1 = one.g1;
      two.b1 = one.b1;
      switch (direction) {
        case directions.RED:
          one.r1 = maxRResult.cutLocation;
          two.r0 = one.r1;
          two.g0 = one.g0;
          two.b0 = one.b0;
          break;
        case directions.GREEN:
          one.g1 = maxGResult.cutLocation;
          two.r0 = one.r0;
          two.g0 = one.g1;
          two.b0 = one.b0;
          break;
        case directions.BLUE:
          one.b1 = maxBResult.cutLocation;
          two.r0 = one.r0;
          two.g0 = one.g0;
          two.b0 = one.b1;
          break;
        default:
          throw new Error("unexpected direction " + direction);
      }
      one.vol = (one.r1 - one.r0) * (one.g1 - one.g0) * (one.b1 - one.b0);
      two.vol = (two.r1 - two.r0) * (two.g1 - two.g0) * (two.b1 - two.b0);
      return true;
    }
    maximize(cube, direction, first, last, wholeR, wholeG, wholeB, wholeW) {
      const bottomR = this.bottom(cube, direction, this.momentsR);
      const bottomG = this.bottom(cube, direction, this.momentsG);
      const bottomB = this.bottom(cube, direction, this.momentsB);
      const bottomW = this.bottom(cube, direction, this.weights);
      let max = 0;
      let cut = -1;
      let halfR = 0;
      let halfG = 0;
      let halfB = 0;
      let halfW = 0;
      for (let i = first; i < last; i++) {
        halfR = bottomR + this.top(cube, direction, i, this.momentsR);
        halfG = bottomG + this.top(cube, direction, i, this.momentsG);
        halfB = bottomB + this.top(cube, direction, i, this.momentsB);
        halfW = bottomW + this.top(cube, direction, i, this.weights);
        if (halfW === 0) {
          continue;
        }
        let tempNumerator = (halfR * halfR + halfG * halfG + halfB * halfB) * 1;
        let tempDenominator = halfW * 1;
        let temp = tempNumerator / tempDenominator;
        halfR = wholeR - halfR;
        halfG = wholeG - halfG;
        halfB = wholeB - halfB;
        halfW = wholeW - halfW;
        if (halfW === 0) {
          continue;
        }
        tempNumerator = (halfR * halfR + halfG * halfG + halfB * halfB) * 1;
        tempDenominator = halfW * 1;
        temp += tempNumerator / tempDenominator;
        if (temp > max) {
          max = temp;
          cut = i;
        }
      }
      return new MaximizeResult(cut, max);
    }
    volume(cube, moment) {
      return moment[this.getIndex(cube.r1, cube.g1, cube.b1)] - moment[this.getIndex(cube.r1, cube.g1, cube.b0)] - moment[this.getIndex(cube.r1, cube.g0, cube.b1)] + moment[this.getIndex(cube.r1, cube.g0, cube.b0)] - moment[this.getIndex(cube.r0, cube.g1, cube.b1)] + moment[this.getIndex(cube.r0, cube.g1, cube.b0)] + moment[this.getIndex(cube.r0, cube.g0, cube.b1)] - moment[this.getIndex(cube.r0, cube.g0, cube.b0)];
    }
    bottom(cube, direction, moment) {
      switch (direction) {
        case directions.RED:
          return -moment[this.getIndex(cube.r0, cube.g1, cube.b1)] + moment[this.getIndex(cube.r0, cube.g1, cube.b0)] + moment[this.getIndex(cube.r0, cube.g0, cube.b1)] - moment[this.getIndex(cube.r0, cube.g0, cube.b0)];
        case directions.GREEN:
          return -moment[this.getIndex(cube.r1, cube.g0, cube.b1)] + moment[this.getIndex(cube.r1, cube.g0, cube.b0)] + moment[this.getIndex(cube.r0, cube.g0, cube.b1)] - moment[this.getIndex(cube.r0, cube.g0, cube.b0)];
        case directions.BLUE:
          return -moment[this.getIndex(cube.r1, cube.g1, cube.b0)] + moment[this.getIndex(cube.r1, cube.g0, cube.b0)] + moment[this.getIndex(cube.r0, cube.g1, cube.b0)] - moment[this.getIndex(cube.r0, cube.g0, cube.b0)];
        default:
          throw new Error("unexpected direction $direction");
      }
    }
    top(cube, direction, position, moment) {
      switch (direction) {
        case directions.RED:
          return moment[this.getIndex(position, cube.g1, cube.b1)] - moment[this.getIndex(position, cube.g1, cube.b0)] - moment[this.getIndex(position, cube.g0, cube.b1)] + moment[this.getIndex(position, cube.g0, cube.b0)];
        case directions.GREEN:
          return moment[this.getIndex(cube.r1, position, cube.b1)] - moment[this.getIndex(cube.r1, position, cube.b0)] - moment[this.getIndex(cube.r0, position, cube.b1)] + moment[this.getIndex(cube.r0, position, cube.b0)];
        case directions.BLUE:
          return moment[this.getIndex(cube.r1, cube.g1, position)] - moment[this.getIndex(cube.r1, cube.g0, position)] - moment[this.getIndex(cube.r0, cube.g1, position)] + moment[this.getIndex(cube.r0, cube.g0, position)];
        default:
          throw new Error("unexpected direction $direction");
      }
    }
    getIndex(r, g, b) {
      return (r << INDEX_BITS * 2) + (r << INDEX_BITS + 1) + r + (g << INDEX_BITS) + g + b;
    }
  };
  var Box = class {
    constructor(r0 = 0, r1 = 0, g0 = 0, g1 = 0, b0 = 0, b1 = 0, vol = 0) {
      this.r0 = r0;
      this.r1 = r1;
      this.g0 = g0;
      this.g1 = g1;
      this.b0 = b0;
      this.b1 = b1;
      this.vol = vol;
    }
  };
  var CreateBoxesResult = class {
    /**
     * @param requestedCount how many colors the caller asked to be returned from
     *     quantization.
     * @param resultCount the actual number of colors achieved from quantization.
     *     May be lower than the requested count.
     */
    constructor(requestedCount, resultCount) {
      this.requestedCount = requestedCount;
      this.resultCount = resultCount;
    }
  };
  var MaximizeResult = class {
    constructor(cutLocation, maximum) {
      this.cutLocation = cutLocation;
      this.maximum = maximum;
    }
  };

  // quantize/quantizer_celebi.js
  var QuantizerCelebi = class {
    /**
     * @param pixels Colors in ARGB format.
     * @param maxColors The number of colors to divide the image into. A lower
     *     number of colors may be returned.
     * @return Map with keys of colors in ARGB format, and values of number of
     *     pixels in the original image that correspond to the color in the
     *     quantized image.
     */
    static quantize(pixels, maxColors) {
      const wu = new QuantizerWu();
      const wuResult = wu.quantize(pixels, maxColors);
      return QuantizerWsmeans.quantize(pixels, wuResult, maxColors);
    }
  };

  // scheme/scheme.js
  var Scheme = class _Scheme {
    get primary() {
      return this.props.primary;
    }
    get onPrimary() {
      return this.props.onPrimary;
    }
    get primaryContainer() {
      return this.props.primaryContainer;
    }
    get onPrimaryContainer() {
      return this.props.onPrimaryContainer;
    }
    get secondary() {
      return this.props.secondary;
    }
    get onSecondary() {
      return this.props.onSecondary;
    }
    get secondaryContainer() {
      return this.props.secondaryContainer;
    }
    get onSecondaryContainer() {
      return this.props.onSecondaryContainer;
    }
    get tertiary() {
      return this.props.tertiary;
    }
    get onTertiary() {
      return this.props.onTertiary;
    }
    get tertiaryContainer() {
      return this.props.tertiaryContainer;
    }
    get onTertiaryContainer() {
      return this.props.onTertiaryContainer;
    }
    get error() {
      return this.props.error;
    }
    get onError() {
      return this.props.onError;
    }
    get errorContainer() {
      return this.props.errorContainer;
    }
    get onErrorContainer() {
      return this.props.onErrorContainer;
    }
    get background() {
      return this.props.background;
    }
    get onBackground() {
      return this.props.onBackground;
    }
    get surface() {
      return this.props.surface;
    }
    get onSurface() {
      return this.props.onSurface;
    }
    get surfaceVariant() {
      return this.props.surfaceVariant;
    }
    get onSurfaceVariant() {
      return this.props.onSurfaceVariant;
    }
    get outline() {
      return this.props.outline;
    }
    get outlineVariant() {
      return this.props.outlineVariant;
    }
    get shadow() {
      return this.props.shadow;
    }
    get scrim() {
      return this.props.scrim;
    }
    get inverseSurface() {
      return this.props.inverseSurface;
    }
    get inverseOnSurface() {
      return this.props.inverseOnSurface;
    }
    get inversePrimary() {
      return this.props.inversePrimary;
    }
    /**
     * @param argb ARGB representation of a color.
     * @return Light Material color scheme, based on the color's hue.
     */
    static light(argb) {
      return _Scheme.lightFromCorePalette(CorePalette.of(argb));
    }
    /**
     * @param argb ARGB representation of a color.
     * @return Dark Material color scheme, based on the color's hue.
     */
    static dark(argb) {
      return _Scheme.darkFromCorePalette(CorePalette.of(argb));
    }
    /**
     * @param argb ARGB representation of a color.
     * @return Light Material content color scheme, based on the color's hue.
     */
    static lightContent(argb) {
      return _Scheme.lightFromCorePalette(CorePalette.contentOf(argb));
    }
    /**
     * @param argb ARGB representation of a color.
     * @return Dark Material content color scheme, based on the color's hue.
     */
    static darkContent(argb) {
      return _Scheme.darkFromCorePalette(CorePalette.contentOf(argb));
    }
    /**
     * Light scheme from core palette
     */
    static lightFromCorePalette(core) {
      return new _Scheme({
        primary: core.a1.tone(40),
        onPrimary: core.a1.tone(100),
        primaryContainer: core.a1.tone(90),
        onPrimaryContainer: core.a1.tone(10),
        secondary: core.a2.tone(40),
        onSecondary: core.a2.tone(100),
        secondaryContainer: core.a2.tone(90),
        onSecondaryContainer: core.a2.tone(10),
        tertiary: core.a3.tone(40),
        onTertiary: core.a3.tone(100),
        tertiaryContainer: core.a3.tone(90),
        onTertiaryContainer: core.a3.tone(10),
        error: core.error.tone(40),
        onError: core.error.tone(100),
        errorContainer: core.error.tone(90),
        onErrorContainer: core.error.tone(10),
        background: core.n1.tone(99),
        onBackground: core.n1.tone(10),
        surface: core.n1.tone(99),
        onSurface: core.n1.tone(10),
        surfaceVariant: core.n2.tone(90),
        onSurfaceVariant: core.n2.tone(30),
        outline: core.n2.tone(50),
        outlineVariant: core.n2.tone(80),
        shadow: core.n1.tone(0),
        scrim: core.n1.tone(0),
        inverseSurface: core.n1.tone(20),
        inverseOnSurface: core.n1.tone(95),
        inversePrimary: core.a1.tone(80)
      });
    }
    /**
     * Dark scheme from core palette
     */
    static darkFromCorePalette(core) {
      return new _Scheme({
        primary: core.a1.tone(80),
        onPrimary: core.a1.tone(20),
        primaryContainer: core.a1.tone(30),
        onPrimaryContainer: core.a1.tone(90),
        secondary: core.a2.tone(80),
        onSecondary: core.a2.tone(20),
        secondaryContainer: core.a2.tone(30),
        onSecondaryContainer: core.a2.tone(90),
        tertiary: core.a3.tone(80),
        onTertiary: core.a3.tone(20),
        tertiaryContainer: core.a3.tone(30),
        onTertiaryContainer: core.a3.tone(90),
        error: core.error.tone(80),
        onError: core.error.tone(20),
        errorContainer: core.error.tone(30),
        onErrorContainer: core.error.tone(80),
        background: core.n1.tone(10),
        onBackground: core.n1.tone(90),
        surface: core.n1.tone(10),
        onSurface: core.n1.tone(90),
        surfaceVariant: core.n2.tone(30),
        onSurfaceVariant: core.n2.tone(80),
        outline: core.n2.tone(60),
        outlineVariant: core.n2.tone(30),
        shadow: core.n1.tone(0),
        scrim: core.n1.tone(0),
        inverseSurface: core.n1.tone(90),
        inverseOnSurface: core.n1.tone(20),
        inversePrimary: core.a1.tone(40)
      });
    }
    constructor(props) {
      this.props = props;
    }
    toJSON() {
      return {
        ...this.props
      };
    }
  };

  // scheme/scheme_android.js
  var SchemeAndroid = class _SchemeAndroid {
    get colorAccentPrimary() {
      return this.props.colorAccentPrimary;
    }
    get colorAccentPrimaryVariant() {
      return this.props.colorAccentPrimaryVariant;
    }
    get colorAccentSecondary() {
      return this.props.colorAccentSecondary;
    }
    get colorAccentSecondaryVariant() {
      return this.props.colorAccentSecondaryVariant;
    }
    get colorAccentTertiary() {
      return this.props.colorAccentTertiary;
    }
    get colorAccentTertiaryVariant() {
      return this.props.colorAccentTertiaryVariant;
    }
    get textColorPrimary() {
      return this.props.textColorPrimary;
    }
    get textColorSecondary() {
      return this.props.textColorSecondary;
    }
    get textColorTertiary() {
      return this.props.textColorTertiary;
    }
    get textColorPrimaryInverse() {
      return this.props.textColorPrimaryInverse;
    }
    get textColorSecondaryInverse() {
      return this.props.textColorSecondaryInverse;
    }
    get textColorTertiaryInverse() {
      return this.props.textColorTertiaryInverse;
    }
    get colorBackground() {
      return this.props.colorBackground;
    }
    get colorBackgroundFloating() {
      return this.props.colorBackgroundFloating;
    }
    get colorSurface() {
      return this.props.colorSurface;
    }
    get colorSurfaceVariant() {
      return this.props.colorSurfaceVariant;
    }
    get colorSurfaceHighlight() {
      return this.props.colorSurfaceHighlight;
    }
    get surfaceHeader() {
      return this.props.surfaceHeader;
    }
    get underSurface() {
      return this.props.underSurface;
    }
    get offState() {
      return this.props.offState;
    }
    get accentSurface() {
      return this.props.accentSurface;
    }
    get textPrimaryOnAccent() {
      return this.props.textPrimaryOnAccent;
    }
    get textSecondaryOnAccent() {
      return this.props.textSecondaryOnAccent;
    }
    get volumeBackground() {
      return this.props.volumeBackground;
    }
    get scrim() {
      return this.props.scrim;
    }
    /**
     * @param argb ARGB representation of a color.
     * @return Light Material color scheme, based on the color's hue.
     */
    static light(argb) {
      const core = CorePalette.of(argb);
      return _SchemeAndroid.lightFromCorePalette(core);
    }
    /**
     * @param argb ARGB representation of a color.
     * @return Dark Material color scheme, based on the color's hue.
     */
    static dark(argb) {
      const core = CorePalette.of(argb);
      return _SchemeAndroid.darkFromCorePalette(core);
    }
    /**
     * @param argb ARGB representation of a color.
     * @return Light Android color scheme, based on the color's hue.
     */
    static lightContent(argb) {
      const core = CorePalette.contentOf(argb);
      return _SchemeAndroid.lightFromCorePalette(core);
    }
    /**
     * @param argb ARGB representation of a color.
     * @return Dark Android color scheme, based on the color's hue.
     */
    static darkContent(argb) {
      const core = CorePalette.contentOf(argb);
      return _SchemeAndroid.darkFromCorePalette(core);
    }
    /**
     * Light scheme from core palette
     */
    static lightFromCorePalette(core) {
      return new _SchemeAndroid({
        colorAccentPrimary: core.a1.tone(90),
        colorAccentPrimaryVariant: core.a1.tone(40),
        colorAccentSecondary: core.a2.tone(90),
        colorAccentSecondaryVariant: core.a2.tone(40),
        colorAccentTertiary: core.a3.tone(90),
        colorAccentTertiaryVariant: core.a3.tone(40),
        textColorPrimary: core.n1.tone(10),
        textColorSecondary: core.n2.tone(30),
        textColorTertiary: core.n2.tone(50),
        textColorPrimaryInverse: core.n1.tone(95),
        textColorSecondaryInverse: core.n1.tone(80),
        textColorTertiaryInverse: core.n1.tone(60),
        colorBackground: core.n1.tone(95),
        colorBackgroundFloating: core.n1.tone(98),
        colorSurface: core.n1.tone(98),
        colorSurfaceVariant: core.n1.tone(90),
        colorSurfaceHighlight: core.n1.tone(100),
        surfaceHeader: core.n1.tone(90),
        underSurface: core.n1.tone(0),
        offState: core.n1.tone(20),
        accentSurface: core.a2.tone(95),
        textPrimaryOnAccent: core.n1.tone(10),
        textSecondaryOnAccent: core.n2.tone(30),
        volumeBackground: core.n1.tone(25),
        scrim: core.n1.tone(80)
      });
    }
    /**
     * Dark scheme from core palette
     */
    static darkFromCorePalette(core) {
      return new _SchemeAndroid({
        colorAccentPrimary: core.a1.tone(90),
        colorAccentPrimaryVariant: core.a1.tone(70),
        colorAccentSecondary: core.a2.tone(90),
        colorAccentSecondaryVariant: core.a2.tone(70),
        colorAccentTertiary: core.a3.tone(90),
        colorAccentTertiaryVariant: core.a3.tone(70),
        textColorPrimary: core.n1.tone(95),
        textColorSecondary: core.n2.tone(80),
        textColorTertiary: core.n2.tone(60),
        textColorPrimaryInverse: core.n1.tone(10),
        textColorSecondaryInverse: core.n1.tone(30),
        textColorTertiaryInverse: core.n1.tone(50),
        colorBackground: core.n1.tone(10),
        colorBackgroundFloating: core.n1.tone(10),
        colorSurface: core.n1.tone(20),
        colorSurfaceVariant: core.n1.tone(30),
        colorSurfaceHighlight: core.n1.tone(35),
        surfaceHeader: core.n1.tone(30),
        underSurface: core.n1.tone(0),
        offState: core.n1.tone(20),
        accentSurface: core.a2.tone(95),
        textPrimaryOnAccent: core.n1.tone(10),
        textSecondaryOnAccent: core.n2.tone(30),
        volumeBackground: core.n1.tone(25),
        scrim: core.n1.tone(80)
      });
    }
    constructor(props) {
      this.props = props;
    }
    toJSON() {
      return { ...this.props };
    }
  };

  // scheme/scheme_content.js
  var SchemeContent = class _SchemeContent extends DynamicScheme {
    constructor(sourceColorHct, isDark, contrastLevel) {
      super({
        sourceColorHct,
        variant: Variant.CONTENT,
        contrastLevel,
        isDark,
        platform: _SchemeContent.DEFAULT_PLATFORM,
        specVersion: _SchemeContent.DEFAULT_SPEC_VERSION
      });
    }
  };
  SchemeContent.DEFAULT_SPEC_VERSION = "2021";
  SchemeContent.DEFAULT_PLATFORM = "phone";

  // dynamiccolor/dynamic_scheme.ts
  var DynamicScheme2 = class _DynamicScheme {
    constructor(args) {
      this.sourceColorArgb = args.sourceColorHct.toInt();
      this.variant = args.variant;
      this.contrastLevel = args.contrastLevel;
      this.isDark = args.isDark;
      this.platform = args.platform ?? "phone";
      this.specVersion = args.specVersion ?? "2021";
      this.sourceColorHct = args.sourceColorHct;
      this.primaryPalette = args.primaryPalette ?? getSpec4(this.specVersion).getPrimaryPalette(
        this.variant,
        args.sourceColorHct,
        this.isDark,
        this.platform,
        this.contrastLevel
      );
      this.secondaryPalette = args.secondaryPalette ?? getSpec4(this.specVersion).getSecondaryPalette(
        this.variant,
        args.sourceColorHct,
        this.isDark,
        this.platform,
        this.contrastLevel
      );
      this.tertiaryPalette = args.tertiaryPalette ?? getSpec4(this.specVersion).getTertiaryPalette(
        this.variant,
        args.sourceColorHct,
        this.isDark,
        this.platform,
        this.contrastLevel
      );
      this.neutralPalette = args.neutralPalette ?? getSpec4(this.specVersion).getNeutralPalette(
        this.variant,
        args.sourceColorHct,
        this.isDark,
        this.platform,
        this.contrastLevel
      );
      this.neutralVariantPalette = args.neutralVariantPalette ?? getSpec4(this.specVersion).getNeutralVariantPalette(
        this.variant,
        args.sourceColorHct,
        this.isDark,
        this.platform,
        this.contrastLevel
      );
      this.errorPalette = args.errorPalette ?? getSpec4(this.specVersion).getErrorPalette(
        this.variant,
        args.sourceColorHct,
        this.isDark,
        this.platform,
        this.contrastLevel
      ) ?? TonalPalette.fromHueAndChroma(25, 84);
      this.colors = new MaterialDynamicColors();
    }
    toString() {
      return `Scheme: variant=${Variant[this.variant]}, mode=${this.isDark ? "dark" : "light"}, platform=${this.platform}, contrastLevel=${this.contrastLevel.toFixed(1)}, seed=${this.sourceColorHct.toString()}, specVersion=${this.specVersion}`;
    }
    /**
     * Returns a new hue based on a piecewise function and input color hue.
     *
     * For example, for the following function:
     * result = 26 if 0 <= hue < 101
     * result = 39 if 101 <= hue < 210
     * result = 28 if 210 <= hue < 360
     *
     * call the function as:
     *
     * const hueBreakpoints = [0, 101, 210, 360];
     * const hues = [26, 39, 28];
     * const result = scheme.piecewise(hue, hueBreakpoints, hues);
     *
     * @param sourceColorHct The input value.
     * @param hueBreakpoints The breakpoints, in sorted order. No default lower or
     *     upper bounds are assumed.
     * @param hues The hues that should be applied when source color's hue is >=
     *     the same index in hueBrakpoints array, and < the hue at the next index
     *     in hueBrakpoints array. Otherwise, the source color's hue is returned.
     */
    static getPiecewiseHue(sourceColorHct, hueBreakpoints, hues) {
      const size = Math.min(hueBreakpoints.length - 1, hues.length);
      const sourceHue = sourceColorHct.hue;
      for (let i = 0; i < size; i++) {
        if (sourceHue >= hueBreakpoints[i] && sourceHue < hueBreakpoints[i + 1]) {
          return sanitizeDegreesDouble(hues[i]);
        }
      }
      return sourceHue;
    }
    /**
     * Returns a shifted hue based on a piecewise function and input color hue.
     *
     * For example, for the following function:
     * result = hue + 26 if 0 <= hue < 101
     * result = hue - 39 if 101 <= hue < 210
     * result = hue + 28 if 210 <= hue < 360
     *
     * call the function as:
     *
     * const hueBreakpoints = [0, 101, 210, 360];
     * const hues = [26, -39, 28];
     * const result = scheme.getRotatedHue(hue, hueBreakpoints, hues);
     *
     * @param sourceColorHct the source color of the theme, in HCT.
     * @param hueBreakpoints The "breakpoints", i.e. the hues at which a rotation
     *     should be apply. No default lower or upper bounds are assumed.
     * @param rotations The rotation that should be applied when source color's
     *     hue is >= the same index in hues array, and < the hue at the next
     *     index in hues array. Otherwise, the source color's hue is returned.
     */
    static getRotatedHue(sourceColorHct, hueBreakpoints, rotations) {
      let rotation = _DynamicScheme.getPiecewiseHue(
        sourceColorHct,
        hueBreakpoints,
        rotations
      );
      if (Math.min(hueBreakpoints.length - 1, rotations.length) <= 0) {
        rotation = 0;
      }
      return sanitizeDegreesDouble(sourceColorHct.hue + rotation);
    }
    getArgb(dynamicColor) {
      return dynamicColor.getArgb(this);
    }
    getHct(dynamicColor) {
      return dynamicColor.getHct(this);
    }
    // Palette key colors
    get primaryPaletteKeyColor() {
      return this.getArgb(this.colors.primaryPaletteKeyColor());
    }
    get secondaryPaletteKeyColor() {
      return this.getArgb(this.colors.secondaryPaletteKeyColor());
    }
    get tertiaryPaletteKeyColor() {
      return this.getArgb(this.colors.tertiaryPaletteKeyColor());
    }
    get neutralPaletteKeyColor() {
      return this.getArgb(this.colors.neutralPaletteKeyColor());
    }
    get neutralVariantPaletteKeyColor() {
      return this.getArgb(this.colors.neutralVariantPaletteKeyColor());
    }
    get errorPaletteKeyColor() {
      return this.getArgb(this.colors.errorPaletteKeyColor());
    }
    // Surface colors
    get background() {
      return this.getArgb(this.colors.background());
    }
    get onBackground() {
      return this.getArgb(this.colors.onBackground());
    }
    get surface() {
      return this.getArgb(this.colors.surface());
    }
    get surfaceDim() {
      return this.getArgb(this.colors.surfaceDim());
    }
    get surfaceBright() {
      return this.getArgb(this.colors.surfaceBright());
    }
    get surfaceContainerLowest() {
      return this.getArgb(this.colors.surfaceContainerLowest());
    }
    get surfaceContainerLow() {
      return this.getArgb(this.colors.surfaceContainerLow());
    }
    get surfaceContainer() {
      return this.getArgb(this.colors.surfaceContainer());
    }
    get surfaceContainerHigh() {
      return this.getArgb(this.colors.surfaceContainerHigh());
    }
    get surfaceContainerHighest() {
      return this.getArgb(this.colors.surfaceContainerHighest());
    }
    get onSurface() {
      return this.getArgb(this.colors.onSurface());
    }
    get surfaceVariant() {
      return this.getArgb(this.colors.surfaceVariant());
    }
    get onSurfaceVariant() {
      return this.getArgb(this.colors.onSurfaceVariant());
    }
    get inverseSurface() {
      return this.getArgb(this.colors.inverseSurface());
    }
    get inverseOnSurface() {
      return this.getArgb(this.colors.inverseOnSurface());
    }
    get outline() {
      return this.getArgb(this.colors.outline());
    }
    get outlineVariant() {
      return this.getArgb(this.colors.outlineVariant());
    }
    get shadow() {
      return this.getArgb(this.colors.shadow());
    }
    get scrim() {
      return this.getArgb(this.colors.scrim());
    }
    get surfaceTint() {
      return this.getArgb(this.colors.surfaceTint());
    }
    // Primary colors
    get primary() {
      return this.getArgb(this.colors.primary());
    }
    get primaryDim() {
      const primaryDim = this.colors.primaryDim();
      if (primaryDim === void 0) {
        throw new Error("`primaryDim` color is undefined prior to 2025 spec.");
      }
      return this.getArgb(primaryDim);
    }
    get onPrimary() {
      return this.getArgb(this.colors.onPrimary());
    }
    get primaryContainer() {
      return this.getArgb(this.colors.primaryContainer());
    }
    get onPrimaryContainer() {
      return this.getArgb(this.colors.onPrimaryContainer());
    }
    get primaryFixed() {
      return this.getArgb(this.colors.primaryFixed());
    }
    get primaryFixedDim() {
      return this.getArgb(this.colors.primaryFixedDim());
    }
    get onPrimaryFixed() {
      return this.getArgb(this.colors.onPrimaryFixed());
    }
    get onPrimaryFixedVariant() {
      return this.getArgb(this.colors.onPrimaryFixedVariant());
    }
    get inversePrimary() {
      return this.getArgb(this.colors.inversePrimary());
    }
    // Secondary colors
    get secondary() {
      return this.getArgb(this.colors.secondary());
    }
    get secondaryDim() {
      const secondaryDim = this.colors.secondaryDim();
      if (secondaryDim === void 0) {
        throw new Error("`secondaryDim` color is undefined prior to 2025 spec.");
      }
      return this.getArgb(secondaryDim);
    }
    get onSecondary() {
      return this.getArgb(this.colors.onSecondary());
    }
    get secondaryContainer() {
      return this.getArgb(this.colors.secondaryContainer());
    }
    get onSecondaryContainer() {
      return this.getArgb(this.colors.onSecondaryContainer());
    }
    get secondaryFixed() {
      return this.getArgb(this.colors.secondaryFixed());
    }
    get secondaryFixedDim() {
      return this.getArgb(this.colors.secondaryFixedDim());
    }
    get onSecondaryFixed() {
      return this.getArgb(this.colors.onSecondaryFixed());
    }
    get onSecondaryFixedVariant() {
      return this.getArgb(this.colors.onSecondaryFixedVariant());
    }
    // Tertiary colors
    get tertiary() {
      return this.getArgb(this.colors.tertiary());
    }
    get tertiaryDim() {
      const tertiaryDim = this.colors.tertiaryDim();
      if (tertiaryDim === void 0) {
        throw new Error("`tertiaryDim` color is undefined prior to 2025 spec.");
      }
      return this.getArgb(tertiaryDim);
    }
    get onTertiary() {
      return this.getArgb(this.colors.onTertiary());
    }
    get tertiaryContainer() {
      return this.getArgb(this.colors.tertiaryContainer());
    }
    get onTertiaryContainer() {
      return this.getArgb(this.colors.onTertiaryContainer());
    }
    get tertiaryFixed() {
      return this.getArgb(this.colors.tertiaryFixed());
    }
    get tertiaryFixedDim() {
      return this.getArgb(this.colors.tertiaryFixedDim());
    }
    get onTertiaryFixed() {
      return this.getArgb(this.colors.onTertiaryFixed());
    }
    get onTertiaryFixedVariant() {
      return this.getArgb(this.colors.onTertiaryFixedVariant());
    }
    // Error colors
    get error() {
      return this.getArgb(this.colors.error());
    }
    get errorDim() {
      const errorDim = this.colors.errorDim();
      if (errorDim === void 0) {
        throw new Error("`errorDim` color is undefined prior to 2025 spec.");
      }
      return this.getArgb(errorDim);
    }
    get onError() {
      return this.getArgb(this.colors.onError());
    }
    get errorContainer() {
      return this.getArgb(this.colors.errorContainer());
    }
    get onErrorContainer() {
      return this.getArgb(this.colors.onErrorContainer());
    }
  };
  var DynamicSchemePalettesDelegateImpl20212 = class {
    //////////////////////////////////////////////////////////////////
    // Scheme Palettes                                              //
    //////////////////////////////////////////////////////////////////
    getPrimaryPalette(variant, sourceColorHct, isDark, platform, contrastLevel) {
      switch (variant) {
        case Variant.CONTENT:
        case Variant.FIDELITY:
          return TonalPalette.fromHueAndChroma(
            sourceColorHct.hue,
            sourceColorHct.chroma
          );
        case Variant.FRUIT_SALAD:
          return TonalPalette.fromHueAndChroma(
            sanitizeDegreesDouble(sourceColorHct.hue - 50),
            48
          );
        case Variant.MONOCHROME:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 0);
        case Variant.NEUTRAL:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 12);
        case Variant.RAINBOW:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 48);
        case Variant.TONAL_SPOT:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 36);
        case Variant.EXPRESSIVE:
          return TonalPalette.fromHueAndChroma(
            sanitizeDegreesDouble(sourceColorHct.hue + 240),
            40
          );
        case Variant.VIBRANT:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 200);
        default:
          throw new Error(`Unsupported variant: ${variant}`);
      }
    }
    getSecondaryPalette(variant, sourceColorHct, isDark, platform, contrastLevel) {
      switch (variant) {
        case Variant.CONTENT:
        case Variant.FIDELITY:
          return TonalPalette.fromHueAndChroma(
            sourceColorHct.hue,
            Math.max(
              sourceColorHct.chroma - 32,
              sourceColorHct.chroma * 0.5
            )
          );
        case Variant.FRUIT_SALAD:
          return TonalPalette.fromHueAndChroma(
            sanitizeDegreesDouble(sourceColorHct.hue - 50),
            36
          );
        case Variant.MONOCHROME:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 0);
        case Variant.NEUTRAL:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 8);
        case Variant.RAINBOW:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 16);
        case Variant.TONAL_SPOT:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 16);
        case Variant.EXPRESSIVE:
          return TonalPalette.fromHueAndChroma(
            DynamicScheme2.getRotatedHue(
              sourceColorHct,
              [0, 21, 51, 121, 151, 191, 271, 321, 360],
              [45, 95, 45, 20, 45, 90, 45, 45, 45]
            ),
            24
          );
        case Variant.VIBRANT:
          return TonalPalette.fromHueAndChroma(
            DynamicScheme2.getRotatedHue(
              sourceColorHct,
              [0, 41, 61, 101, 131, 181, 251, 301, 360],
              [18, 15, 10, 12, 15, 18, 15, 12, 12]
            ),
            24
          );
        default:
          throw new Error(`Unsupported variant: ${variant}`);
      }
    }
    getTertiaryPalette(variant, sourceColorHct, isDark, platform, contrastLevel) {
      switch (variant) {
        case Variant.CONTENT:
          return TonalPalette.fromHct(DislikeAnalyzer.fixIfDisliked(
            new TemperatureCache(sourceColorHct).analogous(
              /* count= */
              3,
              /* divisions= */
              6
            )[2]
          ));
        case Variant.FIDELITY:
          return TonalPalette.fromHct(DislikeAnalyzer.fixIfDisliked(
            new TemperatureCache(sourceColorHct).complement
          ));
        case Variant.FRUIT_SALAD:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 36);
        case Variant.MONOCHROME:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 0);
        case Variant.NEUTRAL:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 16);
        case Variant.RAINBOW:
        case Variant.TONAL_SPOT:
          return TonalPalette.fromHueAndChroma(
            sanitizeDegreesDouble(sourceColorHct.hue + 60),
            24
          );
        case Variant.EXPRESSIVE:
          return TonalPalette.fromHueAndChroma(
            DynamicScheme2.getRotatedHue(
              sourceColorHct,
              [0, 21, 51, 121, 151, 191, 271, 321, 360],
              [120, 120, 20, 45, 20, 15, 20, 120, 120]
            ),
            32
          );
        case Variant.VIBRANT:
          return TonalPalette.fromHueAndChroma(
            DynamicScheme2.getRotatedHue(
              sourceColorHct,
              [0, 41, 61, 101, 131, 181, 251, 301, 360],
              [35, 30, 20, 25, 30, 35, 30, 25, 25]
            ),
            32
          );
        default:
          throw new Error(`Unsupported variant: ${variant}`);
      }
    }
    getNeutralPalette(variant, sourceColorHct, isDark, platform, contrastLevel) {
      switch (variant) {
        case Variant.CONTENT:
        case Variant.FIDELITY:
          return TonalPalette.fromHueAndChroma(
            sourceColorHct.hue,
            sourceColorHct.chroma / 8
          );
        case Variant.FRUIT_SALAD:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 10);
        case Variant.MONOCHROME:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 0);
        case Variant.NEUTRAL:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 2);
        case Variant.RAINBOW:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 0);
        case Variant.TONAL_SPOT:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 6);
        case Variant.EXPRESSIVE:
          return TonalPalette.fromHueAndChroma(
            sanitizeDegreesDouble(sourceColorHct.hue + 15),
            8
          );
        case Variant.VIBRANT:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 10);
        default:
          throw new Error(`Unsupported variant: ${variant}`);
      }
    }
    getNeutralVariantPalette(variant, sourceColorHct, isDark, platform, contrastLevel) {
      switch (variant) {
        case Variant.CONTENT:
          return TonalPalette.fromHueAndChroma(
            sourceColorHct.hue,
            sourceColorHct.chroma / 8 + 4
          );
        case Variant.FIDELITY:
          return TonalPalette.fromHueAndChroma(
            sourceColorHct.hue,
            sourceColorHct.chroma / 8 + 4
          );
        case Variant.FRUIT_SALAD:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 16);
        case Variant.MONOCHROME:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 0);
        case Variant.NEUTRAL:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 2);
        case Variant.RAINBOW:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 0);
        case Variant.TONAL_SPOT:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 8);
        case Variant.EXPRESSIVE:
          return TonalPalette.fromHueAndChroma(
            sanitizeDegreesDouble(sourceColorHct.hue + 15),
            12
          );
        case Variant.VIBRANT:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 12);
        default:
          throw new Error(`Unsupported variant: ${variant}`);
      }
    }
    getErrorPalette(variant, sourceColorHct, isDark, platform, contrastLevel) {
      return void 0;
    }
  };
  var DynamicSchemePalettesDelegateImpl20252 = class _DynamicSchemePalettesDelegateImpl2025 extends DynamicSchemePalettesDelegateImpl20212 {
    //////////////////////////////////////////////////////////////////
    // Scheme Palettes                                              //
    //////////////////////////////////////////////////////////////////
    getPrimaryPalette(variant, sourceColorHct, isDark, platform, contrastLevel) {
      switch (variant) {
        case Variant.NEUTRAL:
          return TonalPalette.fromHueAndChroma(
            sourceColorHct.hue,
            platform === "phone" ? sourceColorHct.isBlue() ? 12 : 8 : sourceColorHct.isBlue() ? 16 : 12
          );
        case Variant.TONAL_SPOT:
          return TonalPalette.fromHueAndChroma(
            sourceColorHct.hue,
            platform === "phone" && isDark ? 26 : 32
          );
        case Variant.EXPRESSIVE:
          return TonalPalette.fromHueAndChroma(
            sourceColorHct.hue,
            platform === "phone" ? isDark ? 36 : 48 : 40
          );
        case Variant.VIBRANT:
          return TonalPalette.fromHueAndChroma(
            sourceColorHct.hue,
            platform === "phone" ? 74 : 56
          );
        default:
          return super.getPrimaryPalette(
            variant,
            sourceColorHct,
            isDark,
            platform,
            contrastLevel
          );
      }
    }
    getSecondaryPalette(variant, sourceColorHct, isDark, platform, contrastLevel) {
      switch (variant) {
        case Variant.NEUTRAL:
          return TonalPalette.fromHueAndChroma(
            sourceColorHct.hue,
            platform === "phone" ? sourceColorHct.isBlue() ? 6 : 4 : sourceColorHct.isBlue() ? 10 : 6
          );
        case Variant.TONAL_SPOT:
          return TonalPalette.fromHueAndChroma(sourceColorHct.hue, 16);
        case Variant.EXPRESSIVE:
          return TonalPalette.fromHueAndChroma(
            DynamicScheme2.getRotatedHue(
              sourceColorHct,
              [0, 105, 140, 204, 253, 278, 300, 333, 360],
              [-160, 155, -100, 96, -96, -156, -165, -160]
            ),
            platform === "phone" ? isDark ? 16 : 24 : 24
          );
        case Variant.VIBRANT:
          return TonalPalette.fromHueAndChroma(
            DynamicScheme2.getRotatedHue(
              sourceColorHct,
              [0, 38, 105, 140, 333, 360],
              [-14, 10, -14, 10, -14]
            ),
            platform === "phone" ? 56 : 36
          );
        default:
          return super.getSecondaryPalette(
            variant,
            sourceColorHct,
            isDark,
            platform,
            contrastLevel
          );
      }
    }
    getTertiaryPalette(variant, sourceColorHct, isDark, platform, contrastLevel) {
      switch (variant) {
        case Variant.NEUTRAL:
          return TonalPalette.fromHueAndChroma(
            DynamicScheme2.getRotatedHue(
              sourceColorHct,
              [0, 38, 105, 161, 204, 278, 333, 360],
              [-32, 26, 10, -39, 24, -15, -32]
            ),
            platform === "phone" ? 20 : 36
          );
        case Variant.TONAL_SPOT:
          return TonalPalette.fromHueAndChroma(
            DynamicScheme2.getRotatedHue(
              sourceColorHct,
              [0, 20, 71, 161, 333, 360],
              [-40, 48, -32, 40, -32]
            ),
            platform === "phone" ? 28 : 32
          );
        case Variant.EXPRESSIVE:
          return TonalPalette.fromHueAndChroma(
            DynamicScheme2.getRotatedHue(
              sourceColorHct,
              [0, 105, 140, 204, 253, 278, 300, 333, 360],
              [-165, 160, -105, 101, -101, -160, -170, -165]
            ),
            48
          );
        case Variant.VIBRANT:
          return TonalPalette.fromHueAndChroma(
            DynamicScheme2.getRotatedHue(
              sourceColorHct,
              [0, 38, 71, 105, 140, 161, 253, 333, 360],
              [-72, 35, 24, -24, 62, 50, 62, -72]
            ),
            56
          );
        default:
          return super.getTertiaryPalette(
            variant,
            sourceColorHct,
            isDark,
            platform,
            contrastLevel
          );
      }
    }
    static getExpressiveNeutralHue(sourceColorHct) {
      return DynamicScheme2.getRotatedHue(
        sourceColorHct,
        [0, 71, 124, 253, 278, 300, 360],
        [10, 0, 10, 0, 10, 0]
      );
    }
    static getExpressiveNeutralChroma(sourceColorHct, isDark, platform) {
      const neutralHue = _DynamicSchemePalettesDelegateImpl2025.getExpressiveNeutralHue(
        sourceColorHct
      );
      const neutralHueIsYellow = neutralHue >= 105 && neutralHue < 125;
      return platform === "phone" ? isDark ? neutralHueIsYellow ? 6 : 14 : 18 : 12;
    }
    static getVibrantNeutralHue(sourceColorHct) {
      return DynamicScheme2.getRotatedHue(
        sourceColorHct,
        [0, 38, 105, 140, 333, 360],
        [-14, 10, -14, 10, -14]
      );
    }
    static getVibrantNeutralChroma(sourceColorHct, platform) {
      const neutralHue = _DynamicSchemePalettesDelegateImpl2025.getVibrantNeutralHue(
        sourceColorHct
      );
      const neutralHueIsBlue = neutralHue >= 250 && neutralHue < 270;
      return platform === "phone" ? 28 : neutralHueIsBlue ? 28 : 20;
    }
    getNeutralPalette(variant, sourceColorHct, isDark, platform, contrastLevel) {
      switch (variant) {
        case Variant.NEUTRAL:
          return TonalPalette.fromHueAndChroma(
            sourceColorHct.hue,
            platform === "phone" ? 1.4 : 6
          );
        case Variant.TONAL_SPOT:
          return TonalPalette.fromHueAndChroma(
            sourceColorHct.hue,
            platform === "phone" ? 5 : 10
          );
        case Variant.EXPRESSIVE:
          return TonalPalette.fromHueAndChroma(
            _DynamicSchemePalettesDelegateImpl2025.getExpressiveNeutralHue(
              sourceColorHct
            ),
            _DynamicSchemePalettesDelegateImpl2025.getExpressiveNeutralChroma(
              sourceColorHct,
              isDark,
              platform
            )
          );
        case Variant.VIBRANT:
          return TonalPalette.fromHueAndChroma(
            _DynamicSchemePalettesDelegateImpl2025.getVibrantNeutralHue(
              sourceColorHct
            ),
            _DynamicSchemePalettesDelegateImpl2025.getVibrantNeutralChroma(
              sourceColorHct,
              platform
            )
          );
        default:
          return super.getNeutralPalette(
            variant,
            sourceColorHct,
            isDark,
            platform,
            contrastLevel
          );
      }
    }
    getNeutralVariantPalette(variant, sourceColorHct, isDark, platform, contrastLevel) {
      switch (variant) {
        case Variant.NEUTRAL:
          return TonalPalette.fromHueAndChroma(
            sourceColorHct.hue,
            (platform === "phone" ? 1.4 : 6) * 2.2
          );
        case Variant.TONAL_SPOT:
          return TonalPalette.fromHueAndChroma(
            sourceColorHct.hue,
            (platform === "phone" ? 5 : 10) * 1.7
          );
        case Variant.EXPRESSIVE:
          const expressiveNeutralHue = _DynamicSchemePalettesDelegateImpl2025.getExpressiveNeutralHue(
            sourceColorHct
          );
          const expressiveNeutralChroma = _DynamicSchemePalettesDelegateImpl2025.getExpressiveNeutralChroma(
            sourceColorHct,
            isDark,
            platform
          );
          return TonalPalette.fromHueAndChroma(
            expressiveNeutralHue,
            expressiveNeutralChroma * (expressiveNeutralHue >= 105 && expressiveNeutralHue < 125 ? 1.6 : 2.3)
          );
        case Variant.VIBRANT:
          const vibrantNeutralHue = _DynamicSchemePalettesDelegateImpl2025.getVibrantNeutralHue(
            sourceColorHct
          );
          const vibrantNeutralChroma = _DynamicSchemePalettesDelegateImpl2025.getVibrantNeutralChroma(
            sourceColorHct,
            platform
          );
          return TonalPalette.fromHueAndChroma(
            vibrantNeutralHue,
            vibrantNeutralChroma * 1.29
          );
        default:
          return super.getNeutralVariantPalette(
            variant,
            sourceColorHct,
            isDark,
            platform,
            contrastLevel
          );
      }
    }
    getErrorPalette(variant, sourceColorHct, isDark, platform, contrastLevel) {
      const errorHue = DynamicScheme2.getPiecewiseHue(
        sourceColorHct,
        [0, 3, 13, 23, 33, 43, 153, 273, 360],
        [12, 22, 32, 12, 22, 32, 22, 12]
      );
      switch (variant) {
        case Variant.NEUTRAL:
          return TonalPalette.fromHueAndChroma(
            errorHue,
            platform === "phone" ? 50 : 40
          );
        case Variant.TONAL_SPOT:
          return TonalPalette.fromHueAndChroma(
            errorHue,
            platform === "phone" ? 60 : 48
          );
        case Variant.EXPRESSIVE:
          return TonalPalette.fromHueAndChroma(
            errorHue,
            platform === "phone" ? 64 : 48
          );
        case Variant.VIBRANT:
          return TonalPalette.fromHueAndChroma(
            errorHue,
            platform === "phone" ? 80 : 60
          );
        default:
          return super.getErrorPalette(
            variant,
            sourceColorHct,
            isDark,
            platform,
            contrastLevel
          );
      }
    }
  };
  var spec20214 = new DynamicSchemePalettesDelegateImpl20212();
  var spec20254 = new DynamicSchemePalettesDelegateImpl20252();
  function getSpec4(specVersion) {
    return specVersion === "2025" ? spec20254 : spec20214;
  }

  // scheme/scheme_expressive.js
  var SchemeExpressive = class _SchemeExpressive extends DynamicScheme2 {
    constructor(sourceColorHct, isDark, contrastLevel, specVersion = _SchemeExpressive.DEFAULT_SPEC_VERSION, platform = _SchemeExpressive.DEFAULT_PLATFORM) {
      super({
        sourceColorHct,
        variant: Variant.EXPRESSIVE,
        contrastLevel,
        isDark,
        platform,
        specVersion
      });
    }
  };
  SchemeExpressive.DEFAULT_SPEC_VERSION = "2021";
  SchemeExpressive.DEFAULT_PLATFORM = "phone";

  // scheme/scheme_fidelity.js
  var SchemeFidelity = class _SchemeFidelity extends DynamicScheme {
    constructor(sourceColorHct, isDark, contrastLevel) {
      super({
        sourceColorHct,
        variant: Variant.FIDELITY,
        contrastLevel,
        isDark,
        platform: _SchemeFidelity.DEFAULT_PLATFORM,
        specVersion: _SchemeFidelity.DEFAULT_SPEC_VERSION
      });
    }
  };
  SchemeFidelity.DEFAULT_SPEC_VERSION = "2021";
  SchemeFidelity.DEFAULT_PLATFORM = "phone";

  // scheme/scheme_fruit_salad.js
  var SchemeFruitSalad = class _SchemeFruitSalad extends DynamicScheme {
    constructor(sourceColorHct, isDark, contrastLevel) {
      super({
        sourceColorHct,
        variant: Variant.FRUIT_SALAD,
        contrastLevel,
        isDark,
        platform: _SchemeFruitSalad.DEFAULT_PLATFORM,
        specVersion: _SchemeFruitSalad.DEFAULT_SPEC_VERSION
      });
    }
  };
  SchemeFruitSalad.DEFAULT_SPEC_VERSION = "2021";
  SchemeFruitSalad.DEFAULT_PLATFORM = "phone";

  // scheme/scheme_monochrome.js
  var SchemeMonochrome = class _SchemeMonochrome extends DynamicScheme {
    constructor(sourceColorHct, isDark, contrastLevel) {
      super({
        sourceColorHct,
        variant: Variant.MONOCHROME,
        contrastLevel,
        isDark,
        platform: _SchemeMonochrome.DEFAULT_PLATFORM,
        specVersion: _SchemeMonochrome.DEFAULT_SPEC_VERSION
      });
    }
  };
  SchemeMonochrome.DEFAULT_SPEC_VERSION = "2021";
  SchemeMonochrome.DEFAULT_PLATFORM = "phone";

  // scheme/scheme_neutral.js
  var SchemeNeutral = class _SchemeNeutral extends DynamicScheme2 {
    constructor(sourceColorHct, isDark, contrastLevel, specVersion = _SchemeNeutral.DEFAULT_SPEC_VERSION, platform = _SchemeNeutral.DEFAULT_PLATFORM) {
      super({
        sourceColorHct,
        variant: Variant.NEUTRAL,
        contrastLevel,
        isDark,
        platform,
        specVersion
      });
    }
  };
  SchemeNeutral.DEFAULT_SPEC_VERSION = "2021";
  SchemeNeutral.DEFAULT_PLATFORM = "phone";

  // scheme/scheme_rainbow.js
  var SchemeRainbow = class _SchemeRainbow extends DynamicScheme {
    constructor(sourceColorHct, isDark, contrastLevel) {
      super({
        sourceColorHct,
        variant: Variant.RAINBOW,
        contrastLevel,
        isDark,
        platform: _SchemeRainbow.DEFAULT_PLATFORM,
        specVersion: _SchemeRainbow.DEFAULT_SPEC_VERSION
      });
    }
  };
  SchemeRainbow.DEFAULT_SPEC_VERSION = "2021";
  SchemeRainbow.DEFAULT_PLATFORM = "phone";

  // scheme/scheme_tonal_spot.js
  var SchemeTonalSpot = class _SchemeTonalSpot extends DynamicScheme2 {
    constructor(sourceColorHct, isDark, contrastLevel, specVersion = _SchemeTonalSpot.DEFAULT_SPEC_VERSION, platform = _SchemeTonalSpot.DEFAULT_PLATFORM) {
      super({
        sourceColorHct,
        variant: Variant.TONAL_SPOT,
        contrastLevel,
        isDark,
        platform,
        specVersion
      });
    }
  };
  SchemeTonalSpot.DEFAULT_SPEC_VERSION = "2021";
  SchemeTonalSpot.DEFAULT_PLATFORM = "phone";

  // scheme/scheme_vibrant.js
  var SchemeVibrant = class _SchemeVibrant extends DynamicScheme2 {
    constructor(sourceColorHct, isDark, contrastLevel, specVersion = _SchemeVibrant.DEFAULT_SPEC_VERSION, platform = _SchemeVibrant.DEFAULT_PLATFORM) {
      super({
        sourceColorHct,
        variant: Variant.VIBRANT,
        contrastLevel,
        isDark,
        platform,
        specVersion
      });
    }
  };
  SchemeVibrant.DEFAULT_SPEC_VERSION = "2021";
  SchemeVibrant.DEFAULT_PLATFORM = "phone";

  // score/score.js
  var SCORE_OPTION_DEFAULTS = {
    desired: 4,
    fallbackColorARGB: 4282549748,
    filter: true
    // Avoid unsuitable colors.
  };
  function compare(a, b) {
    if (a.score > b.score) {
      return -1;
    } else if (a.score < b.score) {
      return 1;
    }
    return 0;
  }
  var Score = class _Score {
    constructor() {
    }
    /**
     * Given a map with keys of colors and values of how often the color appears,
     * rank the colors based on suitability for being used for a UI theme.
     *
     * @param colorsToPopulation map with keys of colors and values of how often
     *     the color appears, usually from a source image.
     * @param {ScoreOptions} options optional parameters.
     * @return Colors sorted by suitability for a UI theme. The most suitable
     *     color is the first item, the least suitable is the last. There will
     *     always be at least one color returned. If all the input colors
     *     were not suitable for a theme, a default fallback color will be
     *     provided, Google Blue.
     */
    static score(colorsToPopulation, options) {
      const { desired, fallbackColorARGB, filter } = { ...SCORE_OPTION_DEFAULTS, ...options };
      const colorsHct = [];
      const huePopulation = new Array(360).fill(0);
      let populationSum = 0;
      for (const [argb, population] of colorsToPopulation.entries()) {
        const hct = Hct.fromInt(argb);
        colorsHct.push(hct);
        const hue = Math.floor(hct.hue);
        huePopulation[hue] += population;
        populationSum += population;
      }
      const hueExcitedProportions = new Array(360).fill(0);
      for (let hue = 0; hue < 360; hue++) {
        const proportion = huePopulation[hue] / populationSum;
        for (let i = hue - 14; i < hue + 16; i++) {
          const neighborHue = sanitizeDegreesInt(i);
          hueExcitedProportions[neighborHue] += proportion;
        }
      }
      const scoredHct = new Array();
      for (const hct of colorsHct) {
        const hue = sanitizeDegreesInt(Math.round(hct.hue));
        const proportion = hueExcitedProportions[hue];
        if (filter && (hct.chroma < _Score.CUTOFF_CHROMA || proportion <= _Score.CUTOFF_EXCITED_PROPORTION)) {
          continue;
        }
        const proportionScore = proportion * 100 * _Score.WEIGHT_PROPORTION;
        const chromaWeight = hct.chroma < _Score.TARGET_CHROMA ? _Score.WEIGHT_CHROMA_BELOW : _Score.WEIGHT_CHROMA_ABOVE;
        const chromaScore = (hct.chroma - _Score.TARGET_CHROMA) * chromaWeight;
        const score = proportionScore + chromaScore;
        scoredHct.push({ hct, score });
      }
      scoredHct.sort(compare);
      const chosenColors = [];
      for (let differenceDegrees2 = 90; differenceDegrees2 >= 15; differenceDegrees2--) {
        chosenColors.length = 0;
        for (const { hct } of scoredHct) {
          const duplicateHue = chosenColors.find((chosenHct) => {
            return differenceDegrees(hct.hue, chosenHct.hue) < differenceDegrees2;
          });
          if (!duplicateHue) {
            chosenColors.push(hct);
          }
          if (chosenColors.length >= desired)
            break;
        }
        if (chosenColors.length >= desired)
          break;
      }
      const colors = [];
      if (chosenColors.length === 0) {
        colors.push(fallbackColorARGB);
      }
      for (const chosenHct of chosenColors) {
        colors.push(chosenHct.toInt());
      }
      return colors;
    }
  };
  Score.TARGET_CHROMA = 48;
  Score.WEIGHT_PROPORTION = 0.7;
  Score.WEIGHT_CHROMA_ABOVE = 0.3;
  Score.WEIGHT_CHROMA_BELOW = 0.1;
  Score.CUTOFF_CHROMA = 5;
  Score.CUTOFF_EXCITED_PROPORTION = 0.01;

  // utils/string_utils.js
  function hexFromArgb(argb) {
    const r = redFromArgb(argb);
    const g = greenFromArgb(argb);
    const b = blueFromArgb(argb);
    const outParts = [r.toString(16), g.toString(16), b.toString(16)];
    for (const [i, part] of outParts.entries()) {
      if (part.length === 1) {
        outParts[i] = "0" + part;
      }
    }
    return "#" + outParts.join("");
  }
  function argbFromHex(hex) {
    hex = hex.replace("#", "");
    const isThree = hex.length === 3;
    const isSix = hex.length === 6;
    const isEight = hex.length === 8;
    if (!isThree && !isSix && !isEight) {
      throw new Error("unexpected hex " + hex);
    }
    let r = 0;
    let g = 0;
    let b = 0;
    if (isThree) {
      r = parseIntHex(hex.slice(0, 1).repeat(2));
      g = parseIntHex(hex.slice(1, 2).repeat(2));
      b = parseIntHex(hex.slice(2, 3).repeat(2));
    } else if (isSix) {
      r = parseIntHex(hex.slice(0, 2));
      g = parseIntHex(hex.slice(2, 4));
      b = parseIntHex(hex.slice(4, 6));
    } else if (isEight) {
      r = parseIntHex(hex.slice(2, 4));
      g = parseIntHex(hex.slice(4, 6));
      b = parseIntHex(hex.slice(6, 8));
    }
    return (255 << 24 | (r & 255) << 16 | (g & 255) << 8 | b & 255) >>> 0;
  }
  function parseIntHex(value) {
    return parseInt(value, 16);
  }

  // utils/image_utils.js
  async function sourceColorFromImage(image) {
    const imageBytes = await new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      const loadCallback = () => {
        canvas.width = image.width;
        canvas.height = image.height;
        context.drawImage(image, 0, 0);
        let rect = [0, 0, image.width, image.height];
        const area = image.dataset["area"];
        if (area && /^\d+(\s*,\s*\d+){3}$/.test(area)) {
          rect = area.split(/\s*,\s*/).map((s) => {
            return parseInt(s, 10);
          });
        }
        const [sx, sy, sw, sh] = rect;
        resolve(context.getImageData(sx, sy, sw, sh).data);
      };
      const errorCallback = () => {
        reject(new Error("Image load failed"));
      };
      if (image.complete) {
        loadCallback();
      } else {
        image.onload = loadCallback;
        image.onerror = errorCallback;
      }
    });
    return sourceColorFromImageBytes(imageBytes);
  }
  function sourceColorFromImageBytes(imageBytes) {
    const pixels = [];
    for (let i = 0; i < imageBytes.length; i += 4) {
      const r = imageBytes[i];
      const g = imageBytes[i + 1];
      const b = imageBytes[i + 2];
      const a = imageBytes[i + 3];
      if (a < 255) {
        continue;
      }
      const argb = argbFromRgb(r, g, b);
      pixels.push(argb);
    }
    const result = QuantizerCelebi.quantize(pixels, 128);
    const ranked = Score.score(result);
    const top = ranked[0];
    return top;
  }

  // utils/theme_utils.js
  function themeFromSourceColor(source, customColors = []) {
    const palette = CorePalette.of(source);
    return {
      source,
      schemes: {
        light: Scheme.light(source),
        dark: Scheme.dark(source)
      },
      palettes: {
        primary: palette.a1,
        secondary: palette.a2,
        tertiary: palette.a3,
        neutral: palette.n1,
        neutralVariant: palette.n2,
        error: palette.error
      },
      customColors: customColors.map((c) => customColor(source, c))
    };
  }
  async function themeFromImage(image, customColors = []) {
    const source = await sourceColorFromImage(image);
    return themeFromSourceColor(source, customColors);
  }
  function customColor(source, color) {
    let value = color.value;
    const from = value;
    const to = source;
    if (color.blend) {
      value = Blend.harmonize(from, to);
    }
    const palette = CorePalette.of(value);
    const tones = palette.a1;
    return {
      color,
      value,
      light: {
        color: tones.tone(40),
        onColor: tones.tone(100),
        colorContainer: tones.tone(90),
        onColorContainer: tones.tone(10)
      },
      dark: {
        color: tones.tone(80),
        onColor: tones.tone(20),
        colorContainer: tones.tone(30),
        onColorContainer: tones.tone(90)
      }
    };
  }
  function applyTheme(theme, options) {
    const target = options?.target || document.body;
    const isDark = options?.dark ?? false;
    const scheme = isDark ? theme.schemes.dark : theme.schemes.light;
    setSchemeProperties(target, scheme);
    if (options?.brightnessSuffix) {
      setSchemeProperties(target, theme.schemes.dark, "-dark");
      setSchemeProperties(target, theme.schemes.light, "-light");
    }
    if (options?.paletteTones) {
      const tones = options?.paletteTones ?? [];
      for (const [key, palette] of Object.entries(theme.palettes)) {
        const paletteKey = key.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
        for (const tone of tones) {
          const token = `--md-ref-palette-${paletteKey}-${paletteKey}${tone}`;
          const color = hexFromArgb(palette.tone(tone));
          target.style.setProperty(token, color);
        }
      }
    }
  }
  function setSchemeProperties(target, scheme, suffix = "") {
    for (const [key, value] of Object.entries(scheme.toJSON())) {
      const token = key.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
      const color = hexFromArgb(value);
      target.style.setProperty(`--md-sys-color-${token}${suffix}`, color);
    }
  }
/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
