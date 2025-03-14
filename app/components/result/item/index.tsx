'use client'
import type { FC } from 'react'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import cn from 'classnames'
import copy from 'copy-to-clipboard'
import { HandThumbDownIcon, HandThumbUpIcon } from '@heroicons/react/24/outline'
import { useBoolean } from 'ahooks'
import { HashtagIcon } from '@heroicons/react/24/solid'
import { Markdown } from '@/app/components/base/markdown'
import Loading from '@/app/components/base/loading'
import Toast from '@/app/components/base/toast'
import type { Feedbacktype, WorkflowProcess } from '@/types/app'
import { updateFeedback } from '@/service'
import Clipboard from '@/app/components/base/icons/line/clipboard'
import RefreshCcw01 from '@/app/components/base/icons/line/refresh-ccw-01'
import CodeEditor from '@/app/components/result/workflow/code-editor'
import WorkflowProcessItem from '@/app/components/result/workflow/workflow-process'
import { CodeLanguage } from '@/types/app'

export type IGenerationItemProps = {
  isWorkflow?: boolean
  workflowProcessData?: WorkflowProcess
  className?: string
  isError: boolean
  onRetry: () => void
  content: any
  messageId?: string | null
  isLoading?: boolean
  isInWebApp?: boolean
  depth?: number
  feedback?: Feedbacktype
  onFeedback?: (feedback: Feedbacktype) => void
  isMobile?: boolean
  taskId?: string
}

export const SimpleBtn = ({ className, isDisabled, onClick, children }: {
  className?: string
  isDisabled?: boolean
  onClick?: () => void
  children: React.ReactNode
}) => (
  <div
    className={cn(className, isDisabled ? 'border-gray-100 text-gray-300' : 'border-gray-200 text-gray-700 cursor-pointer hover:border-gray-300 hover:shadow-sm', 'flex items-center h-7 px-3 rounded-md border text-xs  font-medium')}
    onClick={() => !isDisabled && onClick?.()}
  >
    {children}
  </div>
)

export const copyIcon = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.3335 2.33341C9.87598 2.33341 10.1472 2.33341 10.3698 2.39304C10.9737 2.55486 11.4454 3.02657 11.6072 3.63048C11.6668 3.85302 11.6668 4.12426 11.6668 4.66675V10.0334C11.6668 11.0135 11.6668 11.5036 11.4761 11.8779C11.3083 12.2072 11.0406 12.4749 10.7113 12.6427C10.337 12.8334 9.84692 12.8334 8.86683 12.8334H5.1335C4.1534 12.8334 3.66336 12.8334 3.28901 12.6427C2.95973 12.4749 2.69201 12.2072 2.52423 11.8779C2.3335 11.5036 2.3335 11.0135 2.3335 10.0334V4.66675C2.3335 4.12426 2.3335 3.85302 2.39313 3.63048C2.55494 3.02657 3.02665 2.55486 3.63056 2.39304C3.8531 2.33341 4.12435 2.33341 4.66683 2.33341M5.60016 3.50008H8.40016C8.72686 3.50008 8.89021 3.50008 9.01499 3.4365C9.12475 3.38058 9.21399 3.29134 9.26992 3.18158C9.3335 3.05679 9.3335 2.89345 9.3335 2.56675V2.10008C9.3335 1.77338 9.3335 1.61004 9.26992 1.48525C9.21399 1.37549 9.12475 1.28625 9.01499 1.23033C8.89021 1.16675 8.72686 1.16675 8.40016 1.16675H5.60016C5.27347 1.16675 5.11012 1.16675 4.98534 1.23033C4.87557 1.28625 4.78634 1.37549 4.73041 1.48525C4.66683 1.61004 4.66683 1.77338 4.66683 2.10008V2.56675C4.66683 2.89345 4.66683 3.05679 4.73041 3.18158C4.78634 3.29134 4.87557 3.38058 4.98534 3.4365C5.11012 3.50008 5.27347 3.50008 5.60016 3.50008Z" stroke="#344054" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const GenerationItem: FC<IGenerationItemProps> = ({
  isWorkflow,
  workflowProcessData,
  className,
  isError,
  onRetry,
  content,
  messageId,
  isLoading,
  isInWebApp = false,
  feedback,
  onFeedback,
  depth = 1,
  isMobile,
  taskId,
}) => {
  const { t } = useTranslation()
  const isTop = depth === 1

  const [completionRes, setCompletionRes] = useState('')
  const [childMessageId, setChildMessageId] = useState<string | null>(null)
  const hasChild = !!childMessageId
  const [childFeedback, setChildFeedback] = useState<Feedbacktype>({
    rating: null,
  })

  const handleFeedback = async (childFeedback: Feedbacktype) => {
    await updateFeedback({ url: `/messages/${childMessageId}/feedbacks`, body: { rating: childFeedback.rating } })
    setChildFeedback(childFeedback)
  }

  const [isQuerying, { setTrue: startQuerying, setFalse: stopQuerying }] = useBoolean(false)

  const childProps = {
    isInWebApp: true,
    content: completionRes,
    messageId: childMessageId,
    depth: depth + 1,
    moreLikeThis: true,
    onFeedback: handleFeedback,
    isLoading: isQuerying,
    feedback: childFeedback,
    isMobile,
    isWorkflow,
  }

  const mainStyle = (() => {
    const res: React.CSSProperties = !isTop
      ? {
        background: depth % 2 === 0 ? 'linear-gradient(90.07deg, #F9FAFB 0.05%, rgba(249, 250, 251, 0) 99.93%)' : '#fff',
      }
      : {}

    if (hasChild)
      res.boxShadow = '0px 1px 2px rgba(16, 24, 40, 0.05)'

    return res
  })()

  // regeneration clear child
  useEffect(() => {
    if (isLoading)
      setChildMessageId(null)
  }, [isLoading])

  return (
    <div className={cn(className, isTop ? `rounded-xl border ${!isError ? 'border-gray-200 bg-white' : 'border-[#FECDCA] bg-[#FEF3F2]'} ` : 'rounded-br-xl !mt-0')}
      style={isTop
        ? {
          boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)',
        }
        : {}}
    >
      {isLoading
        ? (
          <div className='flex items-center h-10'><Loading type='area' /></div>
        )
        : (
          <div
            className={cn(!isTop && 'rounded-br-xl border-l-2 border-primary-400', 'p-4')}
            style={mainStyle}
          >
            {(isTop && taskId) && (
              <div className='mb-2 text-gray-500 border border-gray-200 box-border flex items-center rounded-md italic text-[11px] pl-1 pr-1.5 font-medium w-fit group-hover:opacity-100'>
                <HashtagIcon className='w-3 h-3 text-gray-400 fill-current mr-1 stroke-current stroke-1' />
                {taskId}
              </div>)
            }
            <div className='flex'>
              <div className='grow w-0'>
                {workflowProcessData && (
                  <WorkflowProcessItem grayBg hideInfo data={workflowProcessData} expand={workflowProcessData.expand} />
                )}
                {isError && (
                  <div className='text-gray-400 text-sm'>{t('app.generation.batchFailed.outputPlaceholder')}</div>
                )}
                {!isError && (typeof content === 'string') && (
                  <Markdown content={content} />
                )}
                {!isError && (typeof content !== 'string') && (
                  <CodeEditor
                    readOnly
                    title={<div />}
                    language={CodeLanguage.json}
                    value={content}
                    isJSONStringifyBeauty
                  />
                )}
              </div>
            </div>

            <div className='flex items-center justify-between mt-3'>
              <div className='flex items-center'>
                <SimpleBtn
                  isDisabled={isError || !messageId}
                  className={cn(isMobile && '!px-1.5', 'space-x-1')}
                  onClick={() => {
                    if (typeof content === 'string')
                      copy(content)
                    else
                      copy(JSON.stringify(content))
                    Toast.notify({ type: 'success', message: t('common.actionMsg.copySuccessfully') })
                  }}>
                  <Clipboard className='w-3.5 h-3.5' />
                  {!isMobile && <div>{t('common.operation.copy')}</div>}
                </SimpleBtn>
                {isInWebApp && (
                  <>
                    {isError && <SimpleBtn
                      onClick={onRetry}
                      className={cn(isMobile && '!px-1.5', 'ml-2 space-x-1')}
                    >
                      <RefreshCcw01 className='w-3.5 h-3.5' />
                      {!isMobile && <div>{t('app.generation.batchFailed.retry')}</div>}
                    </SimpleBtn>}
                    {!isWorkflow && !isError && messageId && <div className="mx-3 w-[1px] h-[14px] bg-gray-200"></div>}
                    {!isWorkflow && !isError && messageId && !feedback?.rating && (
                      <SimpleBtn className="!px-0">
                        <>
                          <div
                            onClick={() => {
                              onFeedback?.({
                                rating: 'like',
                              })
                            }}
                            className='flex w-6 h-6 items-center justify-center rounded-md cursor-pointer hover:bg-gray-100'>
                            <HandThumbUpIcon width={16} height={16} />
                          </div>
                          <div
                            onClick={() => {
                              onFeedback?.({
                                rating: 'dislike',
                              })
                            }}
                            className='flex w-6 h-6 items-center justify-center rounded-md cursor-pointer hover:bg-gray-100'>
                            <HandThumbDownIcon width={16} height={16} />
                          </div>
                        </>
                      </SimpleBtn>
                    )}
                    {!isWorkflow && !isError && messageId && feedback?.rating === 'like' && (
                      <div
                        onClick={() => {
                          onFeedback?.({
                            rating: null,
                          })
                        }}
                        className='flex w-7 h-7 items-center justify-center rounded-md cursor-pointer  !text-primary-600 border border-primary-200 bg-primary-100 hover:border-primary-300 hover:bg-primary-200'>
                        <HandThumbUpIcon width={16} height={16} />
                      </div>
                    )}
                    {!isWorkflow && !isError && messageId && feedback?.rating === 'dislike' && (
                      <div
                        onClick={() => {
                          onFeedback?.({
                            rating: null,
                          })
                        }}
                        className='flex w-7 h-7 items-center justify-center rounded-md cursor-pointer  !text-red-600 border border-red-200 bg-red-100 hover:border-red-300 hover:bg-red-200'>
                        <HandThumbDownIcon width={16} height={16} />
                      </div>
                    )}
                  </>
                )}
              </div>

            </div>
            <div style={{ marginTop: 20, height: 88 }}>
              {content && content.length && <a href={content[0].url} download="report.pdf" target='_blank'>
                <div className="group/file-item relative p-2 w-[144px] h-[68px] rounded-lg border-[0.5px] border-components-panel-border bg-components-card-bg shadow-xs hover:bg-components-card-bg-alt"><div className="mb-1 h-8 line-clamp-2 system-xs-medium text-text-tertiary break-all cursor-pointer" title="13793bc4800143c3b4cedeae46ea8da4.pdf">
                  Report.pdf</div><div className="relative flex items-center justify-between"><div className="flex items-center system-2xs-medium-uppercase text-text-tertiary"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="remixicon shrink-0 w-4 h-4 text-[#EA3434] mr-1"><path d="M3.9985 2C3.44749 2 3 2.44405 3 2.9918V21.0082C3 21.5447 3.44476 22 3.9934 22H20.0066C20.5551 22 21 21.5489 21 20.9925L20.9997 7L16 2H3.9985ZM10.5 7.5H12.5C12.5 9.98994 14.6436 12.6604 17.3162 13.5513L16.8586 15.49C13.7234 15.0421 10.4821 16.3804 7.5547 18.3321L6.3753 16.7191C7.46149 15.8502 8.50293 14.3757 9.27499 12.6534C10.0443 10.9373 10.5 9.07749 10.5 7.5ZM11.1 13.4716C11.3673 12.8752 11.6043 12.2563 11.8037 11.6285C12.2754 12.3531 12.8553 13.0182 13.5102 13.5953C12.5284 13.7711 11.5666 14.0596 10.6353 14.4276C10.8 14.1143 10.9551 13.7948 11.1 13.4716Z"></path></svg>pdf<div className="mx-1">·</div>
                    {Math.ceil(content[0].size / 1024 * 100) / 100} KB</div><button type="button" className="action-btn action-btn-m hidden group-hover/file-item:flex absolute -right-1 -top-1"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="remixicon w-3.5 h-3.5 text-text-tertiary"><path d="M3 19H21V21H3V19ZM13 13.1716L19.0711 7.1005L20.4853 8.51472L12 17L3.51472 8.51472L4.92893 7.1005L11 13.1716V2H13V13.1716Z"></path></svg></button></div></div>
              </a>}
            </div>
          </div>
        )
      }

      {
        ((childMessageId || isQuerying) && depth < 3) && (
          <div className='pl-4'>
            <GenerationItem {...childProps as any} />
          </div>
        )
      }

    </div >
  )
}
export default React.memo(GenerationItem)
