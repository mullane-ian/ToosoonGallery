import { createRef } from "react"

const myState = {
  sections: 6,
  pages: 5,
  zoom: 75,
  effectToggle:true,
  pause: false,
  showMenu: false,
  shouldDistort:false,
  showSecondary: false,
  ref: createRef(),
  top: createRef()
}

export default myState
