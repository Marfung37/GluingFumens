export default class NumberRingQueue {
  private storage: Int32Array;
  private head = 0;
  private tail = 0;
  private count = 0;
  private capacity: number;

  constructor(initialCapacity = 1024) {
    this.capacity = initialCapacity;
    this.storage = new Int32Array(this.capacity);
  }

  enqueue(value: number): void {
    if (this.count === this.capacity) {
      this.resize();
    }
    this.storage[this.tail] = value;
    this.tail = (this.tail + 1) % this.capacity;
    this.count++;
  }

  dequeue(): number {
    // assumes queue isn't empty
    const value = this.storage[this.head];
    this.head = (this.head + 1) % this.capacity;
    this.count--;
    return value;
  }

  private resize(): void {
    const oldCapacity = this.capacity;
    this.capacity *= 2;
    const newStorage = new Int32Array(this.capacity);

    // Unroll circular buffer into the new larger typed array
    for (let i = 0; i < this.count; i++) {
      newStorage[i] = this.storage[(this.head + i) % oldCapacity];
    }

    this.storage = newStorage;
    this.head = 0;
    this.tail = this.count;
  }

  isEmpty(): boolean {
    return this.count === 0;
  }
}
