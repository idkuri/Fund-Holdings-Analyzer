import { useState } from 'react'
import './App.css'

function App() {

  return (
    <div className='flex flex-col w-screen min-w-screen min-h-screen items-center mx-auto py-8 bg-white gap-[5px]'>
      <div className='flex flex-col w-[75vw] min-w-[500px] mb-4'>
        <div className='flex flex-row items-center w-full mb-2 gap-4 p-5 border-1 border-gray rounded-lg'>
          <div className="bg-blue-950 p-2 inline-block rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="35"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              className="h-10 w-10"
            >
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
              <polyline points="16 7 22 7 22 13"></polyline>
            </svg>
          </div>
          <div className='flex flex-col'>
            <h1 className='text-4xl font-bold'>Fund Holdings Analyzer</h1>
            <p className='text-sm text-gray-500'>N-Port Filing Data Retrieval Tool</p>
          </div>
        </div>
      </div>
      <div data-component="header" className='rounded-2xl p-5 w-[75vw] min-w-[500px] mb-4 bg-card flex flex-col items-center justify-center gap-2'>
        <h1 className='text-2xl font-bold mb-4 text-center text-black '>Analyze Fund Holdings from N-Port Filings</h1>
        <p>Enter a fund's Central Index Key (CIK) to retrieve and analyze its most recent N-Port filing data, including detailed holdings information.</p>
      </div>
      <div className='rounded-2xl outline-1 outline-black flex flex-col w-[30vw] min-w-[500px] min-h-[250px] bg-card items-center justify-center'>
        <h4 className='text-2xl font-semibold'>
          Enter Fund CIK
        </h4>
        <label htmlFor="cik">
          Central Index Key (CIK)
        </label>
        <div className='flex flex-col w-full p-5'>
          <input id="cik"className='border border-gray-300 rounded-md p-2' placeholder="e.g. 0000823277"/>
          <button className='bg-blue-950 text-white rounded-md p-2 mt-4 hover:bg-blue-600 hover:cursor-pointer'>Get Holdings</button>
        </div>
      </div>
    </div>
  )
}

export default App
