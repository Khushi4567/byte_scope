
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal
import struct

app = FastAPI(title="ByteScope API")

# Allow React frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

Width = Literal[8, 16, 32, 64]


# Input models
class IntegerInput(BaseModel):
    value: int
    bits: Width = 16
    signed: bool = True

class FloatInput(BaseModel):
    value: float
    precision: Literal[32, 64] = 32

class BitInput(BaseModel):
    value: int
    bits: Width = 8
    bit_index: int = Field(ge=0)
    new_bit: Literal[0, 1]
    signed: bool = False


# Check number range
def check_range(value, bits, signed):
    if signed:
        minimum = -(2 ** (bits - 1))
        maximum = (2 ** (bits - 1)) - 1
    else:
        minimum = 0
        maximum = (2 ** bits) - 1

    if value < minimum or value > maximum:
        raise HTTPException(
            status_code=422,
            detail=f"Enter a value from {minimum} to {maximum}."
        )


# Memory Explorer calculation
def make_integer_data(value, bits, signed):
    check_range(value, bits, signed)

    byte_count = bits // 8

    raw = value.to_bytes(
        byte_count,
        byteorder="big",
        signed=signed
    )

    number = int.from_bytes(raw, byteorder="big", signed=False)

    binary = format(number, f"0{bits}b")

    memory = []

    for index, byte in enumerate(raw):
        memory.append({
            "address": f"0x{0x1000 + index:04X}",
            "hex": f"{byte:02X}",
            "binary": format(byte, "08b"),
            "decimal": byte
        })

    return {
        "value": value,
        "bits": bits,
        "signed": signed,
        "binary": binary,
        "hex": "0x" + format(number, f"0{bits // 4}X"),
        "byte_count": byte_count,
        "memory": memory,
        "min_value": -(2 ** (bits - 1)) if signed else 0,
        "max_value": (2 ** (bits - 1)) - 1 if signed else (2 ** bits) - 1
    }


@app.get("/")
def home():
    return {"message": "ByteScope API is running"}


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/integer/inspect")
def inspect_integer(data: IntegerInput):
    return make_integer_data(
        data.value,
        data.bits,
        data.signed,
    )


# Float Detective calculation
@app.post("/api/float/inspect")
def inspect_float(data: FloatInput):

    if data.precision == 32:
        format_code = ">f"
        integer_code = ">I"
        exponent_size = 8
    else:
        format_code = ">d"
        integer_code = ">Q"
        exponent_size = 11

    try:
        packed = struct.pack(format_code, data.value)
        stored_value = struct.unpack(format_code, packed)[0]
        number = struct.unpack(integer_code, packed)[0]

    except (OverflowError, struct.error):
        raise HTTPException(
            status_code=422,
            detail="Number is outside the supported range."
        )

    binary = format(number, f"0{data.precision}b")

    return {
        "stored_value": stored_value,
        "hex": "0x" + format(number, f"0{data.precision // 4}X"),
        "binary": binary,
        "sign": binary[0],
        "exponent": binary[1:1 + exponent_size],
        "fraction": binary[1 + exponent_size:],
        "note": "Some decimal values cannot be represented exactly in binary."
    }


# Bit Manipulation calculation
@app.post("/api/memory/modify-bit")
def modify_bit(data: BitInput):

    if data.bit_index >= data.bits:
        raise HTTPException(
            status_code=422,
            detail=f"Bit index must be from 0 to {data.bits - 1}."
        )

    check_range(data.value, data.bits, data.signed)

    mask = 1 << data.bit_index

    before = data.value & ((1 << data.bits) - 1)

    if data.new_bit == 1:
        after = before | mask
    else:
        after = before & ~mask

    if data.signed and after >= (1 << (data.bits - 1)):
        after_value = after - (1 << data.bits)
    else:
        after_value = after

    before_binary = format(before, f"0{data.bits}b")
    after_binary = format(after, f"0{data.bits}b")

    return {
        "before_value": data.value,
        "after_value": after_value,
        "before_binary": before_binary,
        "after_binary": after_binary,
        "before_hex": "0x" + format(before, f"0{data.bits // 4}X"),
        "after_hex": "0x" + format(after, f"0{data.bits // 4}X"),
        "bit_index_from_right": data.bit_index,
        "changed": before_binary != after_binary
    }
