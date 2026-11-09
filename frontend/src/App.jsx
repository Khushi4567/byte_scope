
import { useEffect, useState } from "react";
import "./styles.css";

const API = "http://127.0.0.1:8000/api";

const tabs = [
  ["memory", "Memory Explorer"],
  ["identity", "Number Identity"],
  ["float", "Float Detective"],
  ["bits", "Bit Manipulation"]
];

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function WidthSelect({ value, onChange }) {
  return (
    <Field label="BIT WIDTH">
      <select value={value} onChange={e => onChange(e.target.value)}>
        <option value="8">8-bit</option>
        <option value="16">16-bit</option>
        <option value="32">32-bit</option>
        <option value="64">64-bit</option>
      </select>
    </Field>
  );
}

function MemoryCells({ memory }) {
  return (
    <div className="memory-grid">
      {memory.map((cell, index) => (
        <div className="memory-cell" key={index}>
          <small>{cell.address}</small>
          <strong>{cell.hex}</strong>
          <code>{cell.binary}</code>
          <small>DEC {cell.decimal}</small>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [active, setActive] = useState("memory");
  const [value, setValue] = useState("258");
  const [bits, setBits] = useState("16");
  const [signed, setSigned] = useState(true);
  const [memory, setMemory] = useState(null);
  const [floatValue, setFloatValue] = useState("0.1");
  const [precision, setPrecision] = useState("32");
  const [float, setFloat] = useState(null);
  const [bitIndex, setBitIndex] = useState("0");
  const [newBit, setNewBit] = useState("1");
  const [bitResult, setBitResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState(false);

  useEffect(() => {
    fetch(API + "/health")
      .then(response => setOnline(response.ok))
      .catch(() => setOnline(false));
  }, []);

  async function sendData(path, data) {
    const response = await fetch(API + path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.detail || "Something went wrong");
    }

    return result;
  }

  async function run(action) {
    setError("");
    setLoading(true);

    try {
      await action();
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  }

  function inspectMemory(isSigned = signed) {
    run(async () => {
      const result = await sendData("/integer/inspect", {
        value: Number(value),
        bits: Number(bits),
        signed: isSigned,
      });

      setMemory(result);
    });
  }

  function inspectFloat() {
    run(async () => {
      const result = await sendData("/float/inspect", {
        value: Number(floatValue),
        precision: Number(precision),
      });

      setFloat(result);
    });
  }

  function changeBit() {
    run(async () => {
      const result = await sendData("/memory/modify-bit", {
        value: Number(value),
        bits: Number(bits),
        bit_index: Number(bitIndex),
        new_bit: Number(newBit),
        signed: signed
      });

      setBitResult(result);
    });
  }

  const currentTab = tabs.find(tab => tab[0] === active);

  return (
    <div className="app-shell">

      {/* Sidebar */}
      <aside className="sidebar">

        <div className="brand">
          <div className="brand-mark">B</div>
          <div>
            <b>ByteScope</b>
            <small>COMPUTER MEMORY LAB</small>
          </div>
        </div>

        <p className="nav-label">WORKSPACE</p>

        <nav>
          {tabs.map((tab, index) => (
            <button
              key={tab[0]}
              className={active === tab[0] ? "nav-item selected" : "nav-item"}
              onClick={() => {
                setActive(tab[0]);
                setError("");
              }}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {tab[1]}
            </button>
          ))}
        </nav>

      </aside>

      {/* Main Website */}
      <main className="main">

        <header className="topbar">
          <div>
            <small>COA INTERACTIVE PROJECT</small>
            <h1>{currentTab[1]}</h1>
          </div>

        </header>

        <div className="content">

          <section className="intro">
            <div>
              <small>EXPLORE • DECODE • UNDERSTAND</small>
              <h2>See how computers think in bits.</h2>
              <p>
                Explore how values are stored and represented
                inside computer memory.
              </p>
            </div>

          </section>

          {error && <p className="error">{error}</p>}

          {/* MODULE 1: MEMORY EXPLORER */}
          {active === "memory" && (

            <div className="workspace">

              <section className="panel">
                <h2>Inspect a Value</h2>

                <Field label="DECIMAL VALUE">
                  <input
                    type="number"
                    value={value}
                    onChange={e => setValue(e.target.value)}
                  />
                </Field>

                <WidthSelect value={bits} onChange={setBits} />

                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={signed}
                    onChange={e => setSigned(e.target.checked)}
                  />
                  Signed Integer
                </label>

                <button
                  className="primary-button"
                  onClick={() => inspectMemory()}
                  disabled={loading}
                >
                  {loading ? "Please wait..." : "Inspect Memory"}
                </button>
              </section>

              <section className="panel">
                <h2>Memory Representation</h2>

                {!memory ? (
                  <p className="hint">
                    Enter a value and click Inspect Memory.
                  </p>
                ) : (
                  <>
                    <div className="value-banner">
                      <small>DECIMAL VALUE</small>
                      <strong>{memory.value}</strong>
                      <p>
                        {memory.bits}-bit
                        {memory.signed ? " signed" : " unsigned"} integer
                      </p>
                    </div>

                    <div className="result-grid">
                      <div>
                        <small>BINARY</small>
                        <code>{memory.binary}</code>
                      </div>

                      <div>
                        <small>HEXADECIMAL</small>
                        <code>{memory.hex}</code>
                      </div>
                    </div>

                    <h3>Memory Addresses ({memory.byte_count} bytes)</h3>

                    <MemoryCells memory={memory.memory} />

                    <p className="hint">
                      Valid range: {memory.min_value} to {memory.max_value}
                    </p>
                  </>
                )}
              </section>

            </div>
          )}

          {/* MODULE 2: NUMBER IDENTITY */}
          {active === "identity" && (

            <section className="panel">
              <h2>Number Identity</h2>

              <p className="description">
                See how the same binary pattern can represent
                signed and unsigned numbers.
              </p>

              <div className="form-row">

                <Field label="UNSIGNED DECIMAL VALUE">
                  <input
                    type="number"
                    value={value}
                    onChange={e => setValue(e.target.value)}
                  />
                </Field>

                <WidthSelect value={bits} onChange={setBits} />

                <button
                  className="primary-button"
                  onClick={() => inspectMemory(false)}
                  disabled={loading}
                >
                  Analyze Number
                </button>

              </div>

              {memory && (
                <>
                  <h3>Binary Pattern</h3>

                  <div className="bit-strip">
                    {memory.binary.split("").map((bit, index) => (
                      <span key={index}>{bit}</span>
                    ))}
                  </div>

                  <div className="result-grid">

                    <div>
                      <small>UNSIGNED VALUE</small>
                      <strong>{parseInt(memory.binary, 2)}</strong>
                    </div>

                    <div>
                      <small>SIGNED VALUE (TWO'S COMPLEMENT)</small>
                      <strong>
                        {memory.binary[0] === "1"
                          ? parseInt(memory.binary, 2) - 2 ** Number(bits)
                          : parseInt(memory.binary, 2)}
                      </strong>
                    </div>

                  </div>

                  <p className="hint">
                    The bits stay the same. Only their interpretation changes.
                  </p>
                </>
              )}

            </section>
          )}

          {/* MODULE 3: FLOAT DETECTIVE */}
          {active === "float" && (

            <section className="panel">
              <h2>Float Detective</h2>

              <p className="description">
                Explore how decimal numbers are stored using IEEE 754.
              </p>

              <div className="form-row">

                <Field label="DECIMAL VALUE">
                  <input
                    type="number"
                    step="any"
                    value={floatValue}
                    onChange={e => setFloatValue(e.target.value)}
                  />
                </Field>

                <Field label="PRECISION">
                  <select
                    value={precision}
                    onChange={e => setPrecision(e.target.value)}
                  >
                    <option value="32">Single (32-bit)</option>
                    <option value="64">Double (64-bit)</option>
                  </select>
                </Field>

                <button
                  className="primary-button"
                  onClick={inspectFloat}
                  disabled={loading}
                >
                  Decode Number
                </button>

              </div>

              {float && (
                <div className="float-result">

                  <div className="result-grid">
                    <div>
                      <small>HEXADECIMAL</small>
                      <strong>{float.hex}</strong>
                    </div>

                    <div>
                      <small>STORED VALUE</small>
                      <strong>{float.stored_value}</strong>
                    </div>
                  </div>

                  <h3>IEEE 754 Fields</h3>

                  <div className="result-grid">
                    <div>
                      <small>SIGN (1 BIT)</small>
                      <strong>{float.sign}</strong>
                    </div>

                    <div>
                      <small>EXPONENT</small>
                      <code>{float.exponent}</code>
                    </div>

                    <div>
                      <small>FRACTION</small>
                      <code>{float.fraction}</code>
                    </div>
                  </div>

                  <h3>Complete Binary Pattern</h3>

                  <code className="full-bits">{float.binary}</code>

                  <p className="hint">{float.note}</p>

                </div>
              )}

            </section>
          )}

          {/* MODULE 4: BIT MANIPULATION */}
          {active === "bits" && (

            <section className="panel">
              <h2>Bit Manipulation</h2>

              <p className="description">
                Change one bit and see how the stored number changes.
                Bit index 0 is the rightmost bit.
              </p>

              <div className="form-row">

                <Field label="STARTING VALUE">
                  <input
                    type="number"
                    value={value}
                    onChange={e => setValue(e.target.value)}
                  />
                </Field>

                <WidthSelect value={bits} onChange={setBits} />

                <Field label="BIT INDEX">
                  <input
                    type="number"
                    min="0"
                    max={Number(bits) - 1}
                    value={bitIndex}
                    onChange={e => setBitIndex(e.target.value)}
                  />
                </Field>

                <Field label="NEW BIT">
                  <select
                    value={newBit}
                    onChange={e => setNewBit(e.target.value)}
                  >
                    <option value="0">0</option>
                    <option value="1">1</option>
                  </select>
                </Field>

                <button
                  className="primary-button"
                  onClick={changeBit}
                  disabled={loading}
                >
                  Change Bit
                </button>

              </div>

              {bitResult && (
                <>
                  <div className="result-grid">

                    <div>
                      <small>BEFORE</small>
                      <strong>{bitResult.before_value}</strong>
                      <code>{bitResult.before_hex}</code>
                    </div>

                    <div>
                      <small>AFTER</small>
                      <strong>{bitResult.after_value}</strong>
                      <code>{bitResult.after_hex}</code>
                    </div>

                  </div>

                  <h3>Updated Binary Pattern</h3>

                  <div className="bit-strip">
                    {bitResult.after_binary.split("").map((bit, index) => (
                      <span
                        className={
                          bitResult.before_binary[index] !== bit
                            ? "changed"
                            : ""
                        }
                        key={index}
                      >
                        {bit}
                      </span>
                    ))}
                  </div>

                  <p className="hint">
                    {bitResult.changed
                      ? "Bit changed successfully."
                      : "The bit already had this value."}
                  </p>
                </>
              )}

            </section>
          )}

          <footer>
            BYTESCOPE | COMPUTER ORGANIZATION AND ARCHITECTURE
          </footer>

        </div>
      </main>
    </div>
  );
}
