import { difference } from 'lodash'

const map = {
  '/a' => {
    enter: store => {
      store.dispatch(tagsModule.getTags.action({ condition: null }))
    },
    update: location, store => {
      const condition = TagsSearchCondigion.fromQuery(location.search)
      store.dispatch(tagsModule.getTags.action({ condition: null }))
    }
  },
  'b' => () => {}
}

const emptyLocation = { pathname: '/' }


const createDict = (map) => {
  const dict = {
    enter: {},
    leave: {}
  }

  const types = Object.keys(dict)

  Object.keys(map).forEach(key => {
    if (map[key] instanceof Function) {
      map[key] = {
        enter: map[key]
      }  
    }

    types.forEach(type => {
      if (map[key][type]) {
        dict[type][key] = map[key][type]
      }
    })
  })

  return dict
}

const dispatchEnterHook = (dict, splitPath, splitPrevPath) => {
  const enterDiff = difference(splitPath, splitPrevPath)

  if (!enterDiff.length) {
    return
  }

  let enterBasePath = enterDiff.length < splitPath.length ? `/${splitPrevPath.join('/')}` : '/'

  enterDiff.forEach(part => {
    const execPath = `/${enterBasePath}/${part}`

    if (dict['enter'][execPath] instanceof Function) {
      dict['enter'][execPath]()
    }
  })
}

const dispatchLeaveHook = (dict, splitPath, splitPrevPath) => {
  
}

const dispatchUpdateHook = (dict, execPath: string) => {
  
}

const createMiddleware = (map, config = {}) => {
  const {
    actionType = '@@router/LOCATION_CHANGE',
    hasLocationState = 'router'
  } = config
  const dict = createDict(map) 

  return store => next => action => {
    const { location } = action.payload
    
    if ((action.type !== actionType) || !location) {
      next(action)
      return
    }

    const pathname = location.pathname || '/'
    const { location: prevLocation = emptyLocation } = store.getState()[hasLocationState]
    const prevPathname = prevLocation.location || '/'
    
    // update
    if ((prevPathname === pathname)) {
      if (dict['update'][pathname]) {
        dict['update'][pathname](store, next, action)
      }
    } else {
      const [_a, ...splitPath] = (pathname || '/').split('/')
      const [_b, ...splitPrevPath] = (prevPathname || '/').split('/')
      const enterDiff = difference(splitPath, splitPrevPath)
      const leaveDiff = difference(splitPrevPath, splitPath)

      if (enterDiff.length) {
        let enterBasePath = enterDiff.length < splitPath.length ? prevPathname : '/'

        for (let i = 1; i <= enterDiff.length; i++) {
          const execPath = `/${enterBasePath}/${enterDiff.slice(0, i).join('/')}`

          if (dict['enter'][execPath] instanceof Function) {
            dict['enter'][execPath]()
          }
        }
      }

      if (leaveDiff.length) {
        let leaveBasePath = leaveDiff.length < splitPrevPath.length ? pathname : '/'

        for (let i = leaveDiff.length; i > 0; i--) {
          const execPath = `/${leaveBasePath}/${leaveDiff.slice(0, i).join('/')}`

          if (dict['leave'][execPath] instanceof Function) {
            dict['leave'][execPath]()
          }
        }
      }
    }
  }
}
