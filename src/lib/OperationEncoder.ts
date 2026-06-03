import type { Operation, EncodedOperation, Pos, Piece } from './types';
import { Mino, Rotation } from './defines';
import { positions } from './utils';

export default abstract class OperationEncoder {
  // prevent instantiation
  protected constructor() {}

  /**
   * encode operations for faster comparisons
   */
  static encode(operation: Operation): EncodedOperation {
    /** encode into 14 bit
      * type has 7 possible (3 bits)
      * rotation has 4 possible (2 bits)
      * x has WIDTH (10) possible (4 bits)
      * y has height (20) possible (5 bits)
      */
    let ct = Mino[operation.type];
    ct = (ct << 2) + Rotation[operation.rotation];
    ct = (ct << 4) + operation.x;
    ct = (ct << 5) + operation.y;
    return ct;
  }

  /**
   * decode operations back to objects supported by tetris-fumen
   */
  static decode(ct: EncodedOperation): Operation {
    let y = ct & 0x1F; ct >>= 5;
    let x = ct & 0xF; ct >>= 4;
    let rotation = Rotation[ct & 0x3]; ct >>= 2;
    let type = Mino[ct & 0x7];

    return {
      type: type,
      rotation: rotation,
      x: x,
      y: y
    } as Operation
  }

  /**
   * get y value from encoded operation
   */
  static getY(ct: EncodedOperation): number {
    return ct & 0x1F;
  }

  /**
   * get x value from encoded operation
   */
  static getX(ct: EncodedOperation): number {
    return (ct >> 5) & 0xF;
  }

  /**
   * get rotation from encoded operation
   */
  static getRotation(ct: EncodedOperation): Rotation {
    return (ct >> 9) & 0x3;
  }

  /**
   * get piece from encoded operation
   */
  static getPiece(ct: EncodedOperation): Piece {
    return (ct >> 11) & 0x7;
  }

  /**
   * set y value from encoded operation
   */
  static setY(ct: EncodedOperation, y: number): EncodedOperation {
    return (ct & ~0x1F) | y;
  }

  /**
   * set x value from encoded operation
   */
  static setX(ct: EncodedOperation, x: number): EncodedOperation {
    return (ct & (~0xF << 5)) | (x << 5);
  }

  /**
   * set rotation from encoded operation
   */
  static setRotation(ct: EncodedOperation, rotation: Rotation): EncodedOperation {
    return (ct & (~0x3 << 9)) | (rotation << 9);
  }

  /**
   * set piece from encoded operation
   */
  static setPiece(ct: EncodedOperation, piece: Piece): EncodedOperation {
    return (ct & (~0x7 << 11)) | (piece << 9);
  }

  /**
   * get positions of minos of a piece from encoded operation
   */
  static positions(operation: EncodedOperation): Pos[] {
    const x = this.getX(operation);
    const y = this.getY(operation);
    const piece = this.getPiece(operation);
    const rotation = this.getRotation(operation);
    return positions(x, y, piece, rotation);
  }
}
