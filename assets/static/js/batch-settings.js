// batch-settings.js
function __setting() {
  const elmDate = document.getElementById('date');
  const elmMode = document.getElementById('batch-mode');
  const elmSelf = document.getElementById('mod-self');
  const elmCase = document.getElementById('mod-case');
  const elmF2f = document.getElementById('mod-f2f');
  const elmGroup = document.getElementById('mod-group');
  const split1 = document.getElementById('split1');
  const split2 = document.getElementById('split2');
  const split3 = document.getElementById('split3');
  const split4 = document.getElementById('split4');
  //
  function splitValue() {
    const el = document.querySelector('[name=split]:checked')
    return el ? el.value : "";
  }
  //
  const date_v0 = elmDate.value;
  const self_v0 = elmSelf.value;
  const case_v0 = elmCase.value;
  const f2f_v0 = elmF2f.value;
  const group_v0 = elmGroup.value;
  const split_v0 = splitValue();

  const btnSubmit = document.getElementById('modules-submit');
  const elmSpanMode = document.getElementById('batch-mode-span');

  function hasChanged() {
    return date_v0 != elmDate.value
    || split_v0 != splitValue()
    || self_v0 != elmSelf.value
    || case_v0 != elmCase.value
    || f2f_v0 != elmF2f.value
    || group_v0 != elmGroup.value;
  }
  function submittable() {
    return elmSelf.value || elmCase.value || elmF2f.value || elmGroup.value;
  }

  function syncRadios() {
    const v = elmMode.value;
    split1.setAttribute("disabled", true);
    split2.setAttribute("disabled", true);
    split3.setAttribute("disabled", true);
    split4.setAttribute("disabled", true);
    if (v.startsWith("ALL") || v.startsWith("NO")) {
      split1.removeAttribute("disabled");
      split1.checked = true;
    } else if (v.endsWith("ONLY")) {
      split1.removeAttribute("disabled");
      split2.removeAttribute("disabled");
      split3.removeAttribute("disabled");
      split4.removeAttribute("disabled");
      if (!splitValue()) split4.checked = true;
      if (elmMode.value == 'GROUP-ONLY') {
        split1.setAttribute("disabled", true);
        split2.setAttribute("disabled", true);
        split3.setAttribute("disabled", true);
        split4.checked = true;
      }
    // } else if (v == 'SELF-CASE' || v == 'SELF-GROUP' || v == 'SELF-F2F' || v == 'CASE-GROUP' || v == 'CASE-F2F' || v == 'GROUP-F2F') {
    } else {
      split1.removeAttribute("disabled");
      split2.removeAttribute("disabled");
      const e = document.querySelector('[name=split]:checked')
      if (e) {
        if (e.value != "2" && e.value != "1") {
          // console.log("e.value", e.value)
          e.checked = false;
          split2.checked = true;
        }
      }
    }
  }

  let counter = 0;
  function checkState() {
		// console.log("checkState()")
		// console.log(elmSelf.value, elmCase.value, elmF2f.value, elmGroup.value)
    if (elmSelf.value && elmCase.value && elmF2f.value && elmGroup.value) {
      elmMode.value = 'ALL-TYPES';
    }
    // 3
    else if (!elmSelf.value && elmCase.value && elmF2f.value && elmGroup.value) {
      elmMode.value = 'NO-SELF';
    } else if (elmSelf.value && !elmCase.value && elmF2f.value && elmGroup.value) {
      elmMode.value = 'NO-CASE';
    } else if (elmSelf.value && elmCase.value && !elmF2f.value && elmGroup.value) {
      elmMode.value = 'NO-F2F';
    } else if (elmSelf.value && elmCase.value && elmF2f.value && !elmGroup.value) {
      elmMode.value = 'NO-GROUP';
    }
    // 2
    else if (elmSelf.value && elmCase.value && !elmF2f.value && !elmGroup.value) {
      elmMode.value = 'SELF-CASE';
    } else if (elmSelf.value && !elmCase.value && !elmF2f.value && elmGroup.value) {
      elmMode.value = 'SELF-GROUP';
    } else if (elmSelf.value && !elmCase.value && elmF2f.value && !elmGroup.value) {
      elmMode.value = 'SELF-F2F';
    } else if (!elmSelf.value && elmCase.value && !elmF2f.value && elmGroup.value) {
      elmMode.value = 'CASE-GROUP';
    } else if (!elmSelf.value && elmCase.value && elmF2f.value && !elmGroup.value) {
      elmMode.value = 'CASE-F2F';
    } else if (!elmSelf.value && !elmCase.value && elmF2f.value && elmGroup.value) {
      elmMode.value = 'GROUP-F2F';
    }
    // 1
    else if (elmSelf.value && !elmCase.value && !elmF2f.value && !elmGroup.value) {
      elmMode.value = 'SELF-ONLY';
    } else if (!elmSelf.value && elmCase.value && !elmF2f.value && !elmGroup.value) {
      elmMode.value = 'CASE-ONLY';
    } else if (!elmSelf.value && !elmCase.value && !elmF2f.value && elmGroup.value) {
      elmMode.value = 'GROUP-ONLY';
    } else if (!elmSelf.value && !elmCase.value && elmF2f.value && !elmGroup.value) {
      elmMode.value = 'F2F-ONLY';
    }
    //
    elmSpanMode.innerText = elmMode.value;
    //
    // console.log("counter", counter)
    if (counter > -1) syncRadios();
    counter++;
    //
    btnSubmit.disabled = hasChanged() && submittable() ? false : true;
  }
  //
  elmDate.addEventListener('change', checkState);
  elmSelf.addEventListener('change', checkState);
  elmCase.addEventListener('change', checkState);
  elmF2f.addEventListener('change', checkState);
  elmGroup.addEventListener('change', checkState);
  //
  split1.addEventListener('change', checkState);
  split2.addEventListener('change', checkState);
  split3.addEventListener('change', checkState);
  split4.addEventListener('change', checkState);
  //
  checkState()
}
