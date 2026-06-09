import type { Operation, EncodedOperation, Piece, EncodedMinos } from './types';
import { Mino, Rotation } from './defines';
import MinosEncoder from './MinosEncoder';

/**
 * Static class for operating with packing an Operation object into an EncodedOperation number
 */
export default abstract class OperationEncoder {
  // prevent instantiation
  protected constructor() {}

  /**
   * Encodes/packs an Operation object into an EncodedOperation number
   *
   * @param operation - An Operation object
   *
   * @returns an EncodedOperation number the packs data from Operation
   * @note assumes x, y in Operation are in bounds of a field
   */
  static encode(operation: Operation): EncodedOperation {
    /** encode into 14 bit
     * type has 7 possible (3 bits)
     * rotation has 4 possible (2 bits)
     * x has WIDTH (10) possible (4 bits)
     * y has HEIGHT (20) possible (5 bits)
     */
    let op = Mino[operation.type];
    op = (op << 2) + Rotation[operation.rotation];
    op = (op << 4) + operation.x;
    op = (op << 5) + operation.y;
    return op;
  }

  /**
   * Decodes/unpacks an EncodedOperation number into an Operation object
   *
   * @param op - An EncodedOperation number
   *
   * @returns an Operation object unpacking data from the EncodedOperation number
   */
  static decode(op: EncodedOperation): Operation {
    const y = op & 0x1f;
    op >>= 5;
    const x = op & 0xf;
    op >>= 4;
    const rotation = Rotation[op & 0x3];
    op >>= 2;
    const type = Mino[op & 0x7];

    return {
      type: type,
      rotation: rotation,
      x: x,
      y: y
    } as Operation;
  }

  /**
   * Get y value from EncodedOperation
   *
   * @param op - An EncodedOperation number
   *
   * @returns the y value from the operation
   */
  static getY(op: EncodedOperation): number {
    return op & 0x1f;
  }

  /**
   * Get x value from EncodedOperation
   *
   * @param op - An EncodedOperation number
   *
   * @returns the x value from the operation
   */
  static getX(op: EncodedOperation): number {
    return (op >> 5) & 0xf;
  }

  /**
   * Get rotation value from EncodedOperation
   *
   * @param op - An EncodedOperation number
   *
   * @returns the rotation value as Rotation enum from the operation
   */
  static getRotation(op: EncodedOperation): Rotation {
    return (op >> 9) & 0x3;
  }

  /**
   * Get piece value from EncodedOperation
   *
   * @param op - An EncodedOperation number
   *
   * @returns the piece value as Mino enum from the operation
   */
  static getPiece(op: EncodedOperation): Piece {
    return (op >> 11) & 0x7;
  }

  /**
   * Set y value of EncodedOperation
   *
   * @param op - An EncodedOperation number
   * @param y - The vertical row index to set (0-index, bottom-to-top)
   *
   * @note assumes y value is given in bounds
   */
  static setY(op: EncodedOperation, y: number): EncodedOperation {
    return (op & ~0x1f) | y;
  }

  /**
   * Set x value of EncodedOperation
   *
   * @param op - An EncodedOperation number
   * @param x - The horizontal column index to set (0-index, left-to-right)
   *
   * @note assumes x value is given in bounds
   */
  static setX(op: EncodedOperation, x: number): EncodedOperation {
    return (op & ~(0xf << 5)) | (x << 5);
  }

  /**
   * Set rotation value of EncodedOperation
   *
   * @param op - An EncodedOperation number
   * @param rotation - The rotation of the operation to set as Rotation enum
   */
  static setRotation(op: EncodedOperation, rotation: Rotation): EncodedOperation {
    return (op & ~(0x3 << 9)) | (rotation << 9);
  }

  /**
   * Set piece value of EncodedOperation
   *
   * @param op - An EncodedOperation number
   * @param piece - The piece of the operation to set as Mino enum
   */
  static setPiece(op: EncodedOperation, piece: Piece): EncodedOperation {
    return (op & ~(0x7 << 11)) | (piece << 11);
  }

  /**
   * Shorthand to run MinosEncoder positions on an EncodedOperation
   *
   * @param op - An EncodedOperation number
   *
   * @returns a number that packs all the positions of the minos of the piece
   */
  static positions(op: EncodedOperation): EncodedMinos {
    const x = this.getX(op);
    const y = this.getY(op);
    const piece = this.getPiece(op);
    const rotation = this.getRotation(op);
    return MinosEncoder.positions(x, y, piece, rotation);
  }
}
