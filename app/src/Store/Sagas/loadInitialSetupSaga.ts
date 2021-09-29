import axios from 'axios'
import { takeLatest, put } from "@redux-saga/core/effects"
import { LOAD_INITIAL_SETUP } from "../Actions/data"
import { setInitialSetup } from '../Actions/data'

export function* loadInitialSetupWatcher(): any {
  console.log('Saga: loadInitialSetupWatcher called')
  yield takeLatest(LOAD_INITIAL_SETUP, loadInitialSetupWorker)
}

function* loadInitialSetupWorker(): any {
  console.log('loadInitialSetup worker called!')
  const response = yield axios.get('/TestData/initialSetup.json')
  const data = response.data
  console.log('Saga: loading initial setup finished, sending Action..')
  yield put(setInitialSetup(data))
}