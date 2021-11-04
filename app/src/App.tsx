import './App.css';
import { createStore, combineReducers, applyMiddleware } from 'redux'
import createSagaMiddleware from '@redux-saga/core';
import { Provider } from 'react-redux'
import { composeWithDevTools } from 'redux-devtools-extension';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import { rootSaga } from './Store/Sagas/rootSaga'
import MainView from './Components/Views/MainView'
import dataReducer from './Store/Reducers/data';

const rootReducer = combineReducers({
  dataReducer: dataReducer
})

const configureStore = () => {
  const sagaMiddleware = createSagaMiddleware()
  const store = createStore(rootReducer, composeWithDevTools(
    applyMiddleware(sagaMiddleware))
  )
  sagaMiddleware.run(rootSaga)
  return store
}
const store = configureStore()

const App = (): JSX.Element => {
  return (
    <Provider store={store}>
      <Router>
        <Switch>
          <Route path='/' component={MainView} />
          <Route path='/stateData/:data' component={MainView} />
        </Switch>
      </Router>
    </Provider>
  )
}

export default App;
export { store }

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
