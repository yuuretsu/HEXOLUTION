export class Dichotomy {
  private _value: number

  constructor(value: number) {
    this._value = value
  }

  get right(): number {
    return this._value
  }

  set right(value: number) {
    this._value = value
  }

  get left(): number {
    return 1 - this._value
  }

  set left(value: number) {
    this._value = 1 - value
  }
}
