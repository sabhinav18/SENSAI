import { getResume } from '@/actions/resume'
import React from 'react'
import ResumeBuilder from './_components/resume-builder';

const ResumePage = async () => {
    const resume = await getResume();
  return (
    <div>
        <ResumeBuilder initialeContent={resume?.content}/>
    </div>
  )
}

export default ResumePage