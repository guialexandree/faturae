import { Controller, HttpResponse } from '@/presentation/protocols'
import { ok, serverError } from '@/presentation/helpers'
import { LogControllerDecorator } from '@/main/decorators'
import { LogErrorRepositorySpy } from '@/tests/data/mocks'
import faker from 'faker'

export class ControllerSpy implements Controller {
	httpResponse = ok(faker.datatype.uuid())
  request: any

	async handle (request: any): Promise<HttpResponse> {
		this.request = request
    return await Promise.resolve(this.httpResponse)
	}
}

const mockServerError = (): HttpResponse => {
  const fakeError = new Error()
  fakeError.stack = 'any_stack'
  return serverError(fakeError)
}

interface SutTypes {
  sut: LogControllerDecorator
  controllerSpy: ControllerSpy
  logErrorRepositorySpy: LogErrorRepositorySpy
}

const makeSut = (): SutTypes => {
  const controller = new ControllerSpy()
  const logErrorRepository = new LogErrorRepositorySpy()
  const sut = new LogControllerDecorator(controller, logErrorRepository)

  return {
    sut,
    controllerSpy: controller,
    logErrorRepositorySpy: logErrorRepository
  }
}

describe('LogControllerDecorator', () => {
  test('Deve chamar o handle do controller', async () => {
    const { sut, controllerSpy } = makeSut()
    const request = faker.lorem.sentence()

    await sut.handle(request)

    expect(controllerSpy.request).toEqual(request)
  })

  test('Deve retornar o resultado do controller', async () => {
    const { sut, controllerSpy } = makeSut()

    const response = await sut.handle(faker.lorem.sentence())

    expect(response).toEqual(controllerSpy.httpResponse)
  })

  test('Deve chamar o LogErrorRepository se ocorrer um erro de interno do servidor no controller', async () => {
    const { sut, controllerSpy, logErrorRepositorySpy } = makeSut()
    const serverError = mockServerError()
    controllerSpy.httpResponse = serverError

    await sut.handle(faker.lorem.sentence())

    expect(logErrorRepositorySpy.stack).toBe(serverError.body.stack)
  })
})
