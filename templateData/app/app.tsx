import React from 'react'
import {createRoot} from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import MainPage from './MainPage'

let pageComp = <MainPage />

const routes = {
    home: <MainPage />
}

// route to the page directed by the ?page= query parameter
const params = new URLSearchParams(document.location.search)
// console.log('search params', params)
let page = params.get("page")?.toLowerCase().trim()
// console.log('page='+page)
// if(!page && document.cookie.indexOf("idtbd=") !== -1) {
//     (IDTBD as any).hasCookie = true
// }
pageComp = routes[page] ?? <MainPage />

const container = document.getElementById('root')
const root = createRoot(container)

root.render(
    <>
        <BrowserRouter>
            <Routes>
                <Route path = '/index.html' element= {pageComp} />
                <Route path = '/' element= {pageComp} />
                <Route path = '/Dev/index.html' element= {pageComp} />
                <Route path = '/Dev/+' element= {pageComp} />
                <Route path = '/vod/index.html' element= {pageComp} />
                <Route path = '/vod/+' element= {pageComp} />
            </Routes>
        </BrowserRouter>
    </>
)
