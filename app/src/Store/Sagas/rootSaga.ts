import { fork, all } from 'redux-saga/effects'
import { loadInitialSetupWatcher } from './loadInitialSetupSaga'

export function* rootSaga(): any {
  yield all(
    [
      fork(loadInitialSetupWatcher)
    ]
  )
}