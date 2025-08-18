# Sparse Merkle Tree WASM

## Build

```sh
make build-nodejs
make build-web
```

## Run Web Example

In the project root directory, run:

```sh
npx http-server ./ -p 8000
```

Then open your browser at: [http://127.0.0.1:8000/examples/](http://127.0.0.1:8000/examples/)

## Usage

* **Contract test example**: See line 48 in `tests/ts/tests/smt-ckb.test.ts`
* **Web example**: See line 12 in `examples/index.html`
