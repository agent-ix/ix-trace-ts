# SPDX-License-Identifier: AGPL-3.0-or-later
"""@agent-ix/ix-trace-ts documentation figures, rendered by the docs-figures skill.

Regenerate from the repository root with the agent-ix/dev-tools skill:

    python3 -m pip install fonttools
    python3 <dev-tools>/skills/docs-figures/scripts/render.py docs/images/figures.py

Add --check to confirm the committed SVGs are current. Values are read from this
repository: package.json, src/trace.ts, src/vitest.ts, src/index.ts and src/implementing.ts (the root entry's imports).
"""

import json
import re
from pathlib import Path

from docs_figures import SMALL, TITLE, Figure  # noqa: F401

STYLE = "ix-docs"

ROOT = Path(__file__).resolve().parents[2]

PACKAGE = json.loads((ROOT / "package.json").read_text())
TRACE_SRC = (ROOT / "src" / "trace.ts").read_text()
EMIT_ENV = re.search(r'EMIT_ENV = "([A-Z_]+)"', TRACE_SRC).group(1)
META_KEY = re.search(r'TRACE_META_KEY = "(\w+)"', TRACE_SRC).group(1)
EXPORTS = PACKAGE["exports"]
PEER = PACKAGE["peerDependencies"]["vitest"]
IMPLEMENTING_SRC = (ROOT / "src" / "implementing.ts").read_text()
INDEX_SRC = (ROOT / "src" / "index.ts").read_text()
IMPORTS = re.findall(r'^\s*(?:import|export)\b[^;]*?\bfrom\s+"([^"]+)"', IMPLEMENTING_SRC + INDEX_SRC, re.M)
IMPORTS += re.findall(r'^\s*import\s+"([^"]+)"', IMPLEMENTING_SRC + INDEX_SRC, re.M)
EXTERNAL = [m for m in IMPORTS if not m.startswith(".")]


def exported(path):
    """Names a source file re-exports, read from its export statements."""
    names = []
    for group in re.findall(r"export \{([^}]*)\}", (ROOT / path).read_text()):
        for part in group.split(","):
            name = part.strip().split(" as ")[0].strip()
            if name and name not in names:
                names.append(name)
    return names


ROOT_NAMES = exported("src/index.ts")
VITEST_NAMES = exported("src/vitest.ts")

ROLES = [
    ("code", "test source", "box"),
    ("logic", "processing step", "box"),
    ("model", "JUnit result", "box"),
    ("evidence", "outcome", "box"),
]


def hero():
    """trace() in a test body reaches the JUnit file through the reporter."""
    f = Figure(
        "hero",
        980,
        150,
        f"With {EMIT_ENV}=1, trace(\"FR-001-AC-1\") in a vitest test stores the id on the test's "
        f"meta under {META_KEY}. TraceReporter reads it when the run ends and writes it to the "
        f"JUnit file as a trace property on that test case.",
    )
    cy = 62
    f.box(0, cy - 34, 220, 68, "code", "vitest test", 'trace("FR-001-AC-1")', "in the test body")
    f.box(290, cy - 34, 190, 68, "logic", "test meta", META_KEY, "set while running")
    f.box(540, cy - 34, 190, 68, "logic", "TraceReporter", "onTestRunEnd", f"{EMIT_ENV}=1")
    f.box(790, cy - 34, 190, 68, "model", "junit.xml", '<property name="trace"', 'value="FR-001-AC-1"/>')
    f.line([(220, cy), (287, cy)], "code")
    f.note(228, cy - 9, "id", "code")
    f.line([(480, cy), (537, cy)], "logic")
    f.note(488, cy - 9, "ids", "logic")
    f.line([(730, cy), (787, cy)], "logic", weight=2.4)
    f.note(740, cy - 9, "xml", "logic")
    f.legend(0, 138, ROLES[:3])
    return f


def entries():
    """The two package entries and what each one loads."""
    root_path = EXPORTS["."]["default"].lstrip("./")
    vitest_path = EXPORTS["./vitest"]["default"].lstrip("./")
    root_load = "imports no other package" if not EXTERNAL else "imports " + ", ".join(EXTERNAL)
    f = Figure(
        "entries",
        980,
        176,
        f"The package has two entries. The root exports {', '.join(ROOT_NAMES)} and {root_load}"
        f"{', so production code can use it where no test runner is installed' if not EXTERNAL else ''}. "
        f"The ./vitest subpath exports {', '.join(VITEST_NAMES)} and loads vitest {PEER}.",
    )
    f.box(0, 0, 300, 78, "code", "production code", "class, method or function", "declares what it implements")
    f.box(0, 98, 300, 78, "code", "test code and vitest config", "it(...) bodies", "reporter in vitest.config.ts")
    f.box(400, 0, 300, 78, "logic", "@agent-ix/ix-trace-ts", ", ".join(ROOT_NAMES), root_path)
    f.box(400, 98, 300, 78, "logic", "@agent-ix/ix-trace-ts/vitest", ", ".join(VITEST_NAMES), vitest_path)
    f.box(780, 0, 200, 78, "evidence", "no test runner", root_load, "runs anywhere")
    f.box(780, 98, 200, 78, "model", f"vitest {PEER}", "peer dependency", "optional")
    f.line([(300, 39), (397, 39)], "code")
    f.line([(300, 137), (397, 137)], "code")
    f.line([(700, 39), (777, 39)], "logic")
    f.line([(700, 137), (777, 137)], "logic")
    return f


FIGURES = [hero, entries]
