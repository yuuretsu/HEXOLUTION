export class Brain {
  readonly weights: Float32Array[];
  readonly recurrentWeights: Float32Array[];
  readonly layerSizes: number[];
  private hiddenStates: Float32Array[];

  constructor(inputSize: number, hiddenSizes: number[], outputSize: number, weights?: Float32Array[], recWeights?: Float32Array[]) {
    this.layerSizes = [inputSize, ...hiddenSizes, outputSize];
    this.hiddenStates = hiddenSizes.map(size => new Float32Array(size));

    if (weights && recWeights) {
      this.weights = weights;
      this.recurrentWeights = recWeights;
    } else {
      this.weights = [];
      this.recurrentWeights = [];

      for (let i = 0; i < this.layerSizes.length - 1; i++) {
        const currentSize = this.layerSizes[i];
        const nextSize = this.layerSizes[i + 1];

        const w = new Float32Array(currentSize * nextSize);
        for (let j = 0; j < w.length; j++) w[j] = Math.random() * 2 - 1;
        this.weights.push(w);

        if (i < hiddenSizes.length) {
          const rw = new Float32Array(nextSize * nextSize);
          for (let j = 0; j < rw.length; j++) rw[j] = Math.random() * 2 - 1;
          this.recurrentWeights.push(rw);
        }
      }
    }
  }

  predict(inputs: number[]): number {
    let currentSignals = new Float32Array(inputs);

    for (let i = 0; i < this.weights.length; i++) {
      const currentSize = this.layerSizes[i];
      const nextSize = this.layerSizes[i + 1];
      const nextSignals = new Float32Array(nextSize);

      for (let nextIdx = 0; nextIdx < nextSize; nextIdx++) {
        let sum = 0;

        for (let currIdx = 0; currIdx < currentSize; currIdx++) {
          sum += currentSignals[currIdx] * this.weights[i][nextIdx * currentSize + currIdx];
        }

        if (i < this.recurrentWeights.length) {
          const prevState = this.hiddenStates[i];
          for (let prevIdx = 0; prevIdx < nextSize; prevIdx++) {
            sum += prevState[prevIdx] * this.recurrentWeights[i][nextIdx * nextSize + prevIdx];
          }
          nextSignals[nextIdx] = Math.tanh(sum);
          this.hiddenStates[i].set(nextSignals);
        } else {
          nextSignals[nextIdx] = 1 / (1 + Math.exp(-sum));
        }
      }
      currentSignals = nextSignals;
    }

    return currentSignals.indexOf(Math.max(...currentSignals));
  }

  mutate(rate: number, strength: number): Brain {
    const mutateArr = (arr: Float32Array) => {
      const next = new Float32Array(arr);
      for (let i = 0; i < next.length; i++) {
        if (Math.random() < rate) {
          next[i] += (Math.random() * 2 - 1) * strength;
          next[i] = Math.max(-1, Math.min(1, next[i]));
        }
      }
      return next;
    };

    return new Brain(
      this.layerSizes[0],
      this.layerSizes.slice(1, -1),
      this.layerSizes[this.layerSizes.length - 1],
      this.weights.map(mutateArr),
      this.recurrentWeights.map(mutateArr)
    );
  }
}