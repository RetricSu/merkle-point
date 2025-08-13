import * as bindings from "@ckb-js-std/bindings";
import { HighLevel, log } from "@ckb-js-std/core";
import { validateNewRoot, validateOldRoot } from "./validate";
import { Hex } from "./type";
import { deserializeWitness } from "./util";

function main() {
  HighLevel.checkTypeId(35);

  const witness = HighLevel.loadWitnessArgs(
    0,
    bindings.SOURCE_GROUP_OUTPUT,
  ).inputType;
  if (witness == undefined) {
    return 1;
  }

  const update = deserializeWitness(witness);

  try {
    const inputData = HighLevel.loadCellData(0, bindings.SOURCE_GROUP_INPUT);
    if (inputData.byteLength !== 0) {
      const targetOldRoot = bindings.hex.encode(inputData) as Hex;
      if (validateOldRoot(targetOldRoot, update)) {
        return 2;
      }
    }
  } catch (error) {
    log.debug("no input data");
  }

  try {
    const outputData = HighLevel.loadCellData(0, bindings.SOURCE_GROUP_OUTPUT);
    if (outputData.byteLength !== 0) {
      const targetNewRoot = bindings.hex.encode(outputData) as Hex;
      if (validateNewRoot(targetNewRoot, update)) {
        return 3;
      }
    }
  } catch (error) {
    log.debug("no output data");
  }

  log.info("pass validation!");
  return 0;
}

bindings.exit(main());
